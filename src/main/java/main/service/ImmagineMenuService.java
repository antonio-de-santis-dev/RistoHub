package main.service;

import java.util.LinkedList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import main.domain.ImmagineMenu;
import main.domain.Menu;
import main.repository.ImmagineMenuRepository;
import main.repository.MenuRepository;
import main.service.dto.ImmagineMenuDTO;
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
        ImmagineMenu immagineMenu = immagineMenuMapper.toEntity(immagineMenuDTO);
        immagineMenu = immagineMenuRepository.save(immagineMenu);
        return immagineMenuMapper.toDto(immagineMenu);
    }

    public ImmagineMenuDTO update(ImmagineMenuDTO immagineMenuDTO) {
        LOG.debug("Request to update ImmagineMenu : {}", immagineMenuDTO);
        ImmagineMenu immagineMenu = immagineMenuMapper.toEntity(immagineMenuDTO);
        immagineMenu = immagineMenuRepository.save(immagineMenu);
        return immagineMenuMapper.toDto(immagineMenu);
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
        return immagineMenuRepository.findAll().stream().map(immagineMenuMapper::toDto).collect(Collectors.toCollection(LinkedList::new));
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
        long count = immagineMenuRepository.countByMenuIdAndTipo(menuId, main.domain.enumeration.TipoImmagine.COPERTINA);
        if (count >= 5) {
            throw new IllegalStateException("Limite massimo di 5 immagini di copertina raggiunto");
        }

        ImmagineMenu img = new ImmagineMenu();
        img.setMenu(menu);
        img.setNome(file.getOriginalFilename());
        img.setImmagine(file.getBytes());
        img.setImmagineContentType(file.getContentType());
        img.setContentType(file.getContentType());
        img.setOrdine((int) count);
        img.setVisibile(true);

        // Usa TipoImmagine.COPERTINA — assicurati che esista nell'enum,
        // altrimenti usa TipoImmagine.values()[0] o un valore esistente
        try {
            img.setTipo(main.domain.enumeration.TipoImmagine.valueOf("COPERTINA"));
        } catch (IllegalArgumentException e) {
            // Se COPERTINA non esiste nell'enum, usa il primo valore disponibile
            img.setTipo(main.domain.enumeration.TipoImmagine.values()[0]);
        }

        img = immagineMenuRepository.save(img);
        return immagineMenuMapper.toDto(img);
    }

    /**
     * Aggiorna in bulk ordine e visibilità delle immagini di copertina di un menu.
     * Riceve una lista di {id, ordine, visibile} — NON tocca i byte dell'immagine.
     */
    public List<ImmagineMenuDTO> aggiornaOrdineEVisibilita(UUID menuId, List<ImmagineMenuDTO> updates) {
        LOG.debug("Request to update ordine/visibilita for Menu : {}", menuId);

        for (ImmagineMenuDTO update : updates) {
            immagineMenuRepository
                .findById(update.getId())
                .ifPresent(img -> {
                    // Verifica che l'immagine appartenga al menu richiesto
                    if (!img.getMenu().getId().equals(menuId)) {
                        throw new IllegalArgumentException("Immagine non appartiene al menu: " + update.getId());
                    }
                    if (update.getOrdine() != null) img.setOrdine(update.getOrdine());
                    if (update.getVisibile() != null) img.setVisibile(update.getVisibile());
                    immagineMenuRepository.save(img);
                });
        }

        return findByMenuId(menuId);
    }
}
