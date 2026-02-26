package main.service;

import java.util.*;
import java.util.stream.Collectors;
import main.domain.ContattoItem;
import main.domain.ListaContatti;
import main.repository.ListaContattiRepository;
import main.repository.UserRepository;
import main.service.dto.ContattoItemDTO;
import main.service.dto.ListaContattiDTO;
import main.service.dto.UserDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service per la gestione di {@link ListaContatti}.
 *
 * Accessibile a qualsiasi utente registrato (ROLE_USER o ROLE_ADMIN).
 * Ogni utente vede e modifica esclusivamente le proprie liste grazie al
 * filtraggio per login e al controllo di proprietà in update/delete.
 */
@Service
@Transactional
public class ListaContattiService {

    private static final Logger LOG = LoggerFactory.getLogger(ListaContattiService.class);

    private final ListaContattiRepository listaContattiRepository;
    private final UserRepository userRepository;

    public ListaContattiService(ListaContattiRepository listaContattiRepository, UserRepository userRepository) {
        this.listaContattiRepository = listaContattiRepository;
        this.userRepository = userRepository;
    }

    // ── CRUD ─────────────────────────────────────────────────────

    /**
     * Crea una nuova lista e la associa all'utente corrente.
     * Funziona per qualsiasi utente autenticato.
     */
    public ListaContattiDTO save(ListaContattiDTO dto) {
        LOG.debug("Request to save ListaContatti : {}", dto);
        ListaContatti entity = toEntity(dto);

        // Associa automaticamente all'utente loggato (user o admin)
        String login = SecurityContextHolder.getContext().getAuthentication().getName();
        userRepository.findOneByLogin(login).ifPresent(entity::setRistoratore);

        entity = listaContattiRepository.save(entity);
        return toDto(entity);
    }

    /**
     * Aggiorna una lista esistente.
     * Solo il proprietario può modificarla.
     */
    public ListaContattiDTO update(ListaContattiDTO dto) {
        LOG.debug("Request to update ListaContatti : {}", dto);

        ListaContatti existing = listaContattiRepository
            .findById(dto.getId())
            .orElseThrow(() -> new IllegalArgumentException("ListaContatti non trovata: " + dto.getId()));

        // Controllo proprietà: solo il proprietario può modificare
        String login = SecurityContextHolder.getContext().getAuthentication().getName();
        if (existing.getRistoratore() != null && !login.equals(existing.getRistoratore().getLogin())) {
            throw new SecurityException("Non autorizzato a modificare questa lista");
        }

        existing.setNome(dto.getNome());
        existing.setMenuIds(dto.getMenuIds() != null ? dto.getMenuIds() : new HashSet<>());

        // Ricrea gli items: svuota e reinserisce in ordine
        existing.getItems().clear();
        if (dto.getItems() != null) {
            for (int i = 0; i < dto.getItems().size(); i++) {
                ContattoItem item = toItemEntity(dto.getItems().get(i));
                item.setOrdine(i);
                existing.addItem(item);
            }
        }
        existing = listaContattiRepository.save(existing);
        return toDto(existing);
    }

    /**
     * Elimina una lista per ID.
     * Solo il proprietario può eliminarla.
     */
    public void delete(UUID id) {
        LOG.debug("Request to delete ListaContatti : {}", id);

        // Controllo proprietà prima di eliminare
        String login = SecurityContextHolder.getContext().getAuthentication().getName();
        listaContattiRepository
            .findById(id)
            .ifPresent(lista -> {
                if (lista.getRistoratore() != null && !login.equals(lista.getRistoratore().getLogin())) {
                    throw new SecurityException("Non autorizzato a eliminare questa lista");
                }
            });
        listaContattiRepository.deleteById(id);
    }

    // ── Query ─────────────────────────────────────────────────────

    /**
     * Tutte le liste dell'utente corrente (ROLE_USER o ROLE_ADMIN).
     */
    @Transactional(readOnly = true)
    public List<ListaContattiDTO> findAllByCurrentUser() {
        return listaContattiRepository.findByRistoratoreIsCurrentUser().stream().map(this::toDto).collect(Collectors.toList());
    }

    /**
     * Singola lista per ID.
     */
    @Transactional(readOnly = true)
    public Optional<ListaContattiDTO> findOne(UUID id) {
        return listaContattiRepository.findById(id).map(this::toDto);
    }

    /**
     * Liste associate a un menu — usato dal menu-view pubblico.
     */
    @Transactional(readOnly = true)
    public List<ListaContattiDTO> findByMenuId(UUID menuId) {
        return listaContattiRepository.findByMenuId(menuId).stream().map(this::toDto).collect(Collectors.toList());
    }

    // ── Conversione Entity ↔ DTO ──────────────────────────────────

    private ListaContattiDTO toDto(ListaContatti e) {
        ListaContattiDTO dto = new ListaContattiDTO();
        dto.setId(e.getId());
        dto.setNome(e.getNome());
        dto.setMenuIds(e.getMenuIds() != null ? new HashSet<>(e.getMenuIds()) : new HashSet<>());

        if (e.getRistoratore() != null) {
            UserDTO u = new UserDTO();
            u.setId(e.getRistoratore().getId());
            u.setLogin(e.getRistoratore().getLogin());
            dto.setRistoratore(u);
        }

        List<ContattoItemDTO> itemDtos =
            (e.getItems() != null ? e.getItems() : List.<ContattoItem>of()).stream()
                .sorted(Comparator.comparingInt(i -> (i.getOrdine() != null ? i.getOrdine() : 0)))
                .map(this::toItemDto)
                .collect(Collectors.toList());
        dto.setItems(itemDtos);
        return dto;
    }

    private ListaContatti toEntity(ListaContattiDTO dto) {
        ListaContatti e = new ListaContatti();
        if (dto.getId() != null) e.setId(dto.getId());
        e.setNome(dto.getNome());
        e.setMenuIds(dto.getMenuIds() != null ? new HashSet<>(dto.getMenuIds()) : new HashSet<>());
        if (dto.getItems() != null) {
            for (int i = 0; i < dto.getItems().size(); i++) {
                ContattoItem item = toItemEntity(dto.getItems().get(i));
                item.setOrdine(i);
                e.addItem(item);
            }
        }
        return e;
    }

    private ContattoItemDTO toItemDto(ContattoItem item) {
        ContattoItemDTO dto = new ContattoItemDTO();
        dto.setId(item.getId());
        dto.setTipo(item.getTipo());
        dto.setValore(item.getValore());
        dto.setReteSociale(item.getReteSociale());
        dto.setEtichetta(item.getEtichetta());
        dto.setOrdine(item.getOrdine());
        if (item.getListaContatti() != null) dto.setListaContattiId(item.getListaContatti().getId());
        return dto;
    }

    private ContattoItem toItemEntity(ContattoItemDTO dto) {
        ContattoItem item = new ContattoItem();
        if (dto.getId() != null) item.setId(dto.getId());
        item.setTipo(dto.getTipo());
        item.setValore(dto.getValore());
        item.setReteSociale(dto.getReteSociale());
        item.setEtichetta(dto.getEtichetta());
        item.setOrdine(dto.getOrdine() != null ? dto.getOrdine() : 0);
        return item;
    }
}
