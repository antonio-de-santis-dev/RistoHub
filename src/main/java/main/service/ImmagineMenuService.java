package main.service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import main.domain.ImmagineMenu;
import main.domain.Menu;
import main.domain.enumeration.TipoImmagine;
import main.repository.ImmagineMenuRepository;
import main.repository.ImmagineMenuRepository.ImmagineMenuMeta;
import main.repository.MenuRepository;
import main.service.dto.ImmagineMenuDTO;
import main.service.dto.ImmagineMenuMetaDTO;
import main.service.mapper.ImmagineMenuMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/**
 * Service Implementation for managing {@link main.domain.ImmagineMenu}.
 */
@Service
@Transactional
public class ImmagineMenuService {

    private static final Logger LOG = LoggerFactory.getLogger(ImmagineMenuService.class);

    private final ImmagineMenuRepository immagineMenuRepository;
    private final ImmagineMenuMapper immagineMenuMapper;
    private final MenuRepository menuRepository;

    public ImmagineMenuService(
        ImmagineMenuRepository immagineMenuRepository,
        ImmagineMenuMapper immagineMenuMapper,
        MenuRepository menuRepository
    ) {
        this.immagineMenuRepository = immagineMenuRepository;
        this.immagineMenuMapper = immagineMenuMapper;
        this.menuRepository = menuRepository;
    }

    public ImmagineMenuDTO save(ImmagineMenuDTO immagineMenuDTO) {
        LOG.debug("Request to save ImmagineMenu : {}", immagineMenuDTO);
        return persistImmagineMenu(immagineMenuDTO);
    }

    public ImmagineMenuDTO update(ImmagineMenuDTO immagineMenuDTO) {
        LOG.debug("Request to update ImmagineMenu : {}", immagineMenuDTO);
        return persistImmagineMenu(immagineMenuDTO);
    }

    // OPT-10: metodo privato condiviso — evita duplicazione tra save() e update()
    private ImmagineMenuDTO persistImmagineMenu(ImmagineMenuDTO dto) {
        ImmagineMenu immagineMenu = immagineMenuMapper.toEntity(dto);
        return immagineMenuMapper.toDto(immagineMenuRepository.save(immagineMenu));
    }

    public Optional<ImmagineMenuDTO> partialUpdate(ImmagineMenuDTO immagineMenuDTO) {
        LOG.debug("Request to partially update ImmagineMenu : {}", immagineMenuDTO);
        return immagineMenuRepository
            .findById(immagineMenuDTO.getId())
            .map(existingImmagineMenu -> {
                immagineMenuMapper.partialUpdate(existingImmagineMenu, immagineMenuDTO);
                return existingImmagineMenu;
            })
            .map(immagineMenuRepository::save)
            .map(immagineMenuMapper::toDto);
    }

    @Transactional(readOnly = true)
    public List<ImmagineMenuDTO> findAll() {
        LOG.debug("Request to get all ImmagineMenus");
        return immagineMenuRepository.findAll().stream().map(immagineMenuMapper::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<ImmagineMenuDTO> findOne(UUID id) {
        LOG.debug("Request to get ImmagineMenu : {}", id);
        return immagineMenuRepository.findById(id).map(immagineMenuMapper::toDto);
    }

    public void delete(UUID id) {
        LOG.debug("Request to delete ImmagineMenu : {}", id);
        immagineMenuRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<ImmagineMenuDTO> findByMenuId(UUID menuId) {
        return immagineMenuRepository
            .findByMenuIdOrderByOrdine(menuId)
            .stream()
            .map(immagineMenuMapper::toDto)
            .collect(Collectors.toList());
    }

    /**
     * Upload una nuova immagine di copertina come BLOB nel DB.
     * Tipo impostato automaticamente a COPERTINA.
     */
    public ImmagineMenuDTO uploadCopertina(UUID menuId, MultipartFile file) throws Exception {
        LOG.debug("Request to upload copertina for Menu : {}", menuId);

        Menu menu = menuRepository.findById(menuId).orElseThrow(() -> new IllegalArgumentException("Menu non trovato: " + menuId));

        // Conta immagini esistenti per assegnare l'ordine
        // Conta solo le COPERTINA (non il LOGO) per il limite di 5
        long count = immagineMenuRepository.countByMenuIdAndTipo(menuId, TipoImmagine.COPERTINA);
        if (count >= 5) {
            throw new IllegalStateException("Limite massimo di 5 immagini di copertina raggiunto");
        }

        ImmagineMenu img = new ImmagineMenu();
        img.setMenu(menu);
        img.setNome(file.getOriginalFilename());
        img.setImmagine(file.getBytes());
        img.setImmagineContentType(file.getContentType());
        img.setOrdine((int) count);
        img.setVisibile(true);
        img.setTipo(TipoImmagine.COPERTINA);
        img = immagineMenuRepository.save(img);
        return immagineMenuMapper.toDto(img);
    }

    /**
     * OPT-07: Aggiorna in bulk ordine e visibilità con query JPQL dirette.
     *
     * PRIMA: N × (SELECT * + UPDATE *) + 1 × SELECT * (con blob!)
     *   = 2N+1 query, carica tutti i blob in memoria solo per restituirli.
     *
     * DOPO: N × UPDATE (JPQL, nessun SELECT) + 1 × SELECT metadati (senza blob)
     *   = N+1 query, zero blob in memoria.
     *
     * La WHERE i.menu.id = :menuId nel JPQL garantisce che non si possano
     * modificare immagini di altri menu (security by design, senza check applicativo).
     *
     * @return lista di metadati aggiornati (senza byte[] immagine)
     */
    public List<ImmagineMenuMetaDTO> aggiornaOrdineEVisibilita(UUID menuId, List<ImmagineMenuDTO> updates) {
        LOG.debug("Request to bulk-update ordine/visibilita for Menu : {}", menuId);

        for (ImmagineMenuDTO update : updates) {
            if (update.getId() == null) continue;
            Integer ordine = update.getOrdine() != null ? update.getOrdine() : 0;
            Boolean visibile = update.getVisibile() != null ? update.getVisibile() : true;

            int updated = immagineMenuRepository.updateOrdineAndVisibile(update.getId(), menuId, ordine, visibile);
            if (updated == 0) {
                LOG.warn("Immagine {} non trovata o non appartiene al menu {}", update.getId(), menuId);
            }
        }

        // Ricarica solo i metadati (senza blob) per la risposta di conferma
        return immagineMenuRepository
            .findMetaByMenuId(menuId)
            .stream()
            .map(m ->
                new ImmagineMenuMetaDTO(
                    m.getId(),
                    m.getNome(),
                    m.getImmagineContentType(),
                    m.getTipo() != null ? m.getTipo().toString() : null,
                    m.getOrdine(),
                    m.getVisibile()
                )
            )
            .collect(java.util.stream.Collectors.toList());
    }
}
