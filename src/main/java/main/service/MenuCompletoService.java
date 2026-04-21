package main.service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import main.domain.PiattoDelGiorno;
import main.domain.Portata;
import main.repository.MenuRepository;
import main.repository.PortataRepository;
import main.service.dto.AllergeneDTO;
import main.service.dto.ImmagineMenuMetaDTO;
import main.service.dto.ListaContattiDTO;
import main.service.dto.MenuCompletoDTO;
import main.service.dto.MenuDTO;
import main.service.dto.PiattoDelGiornoDTO;
import main.service.dto.PortataConProdottiDTO;
import main.service.dto.ProdottoDTO;
import main.service.mapper.MenuMapper;
import main.service.mapper.PiattoDelGiornoMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service responsabile dell'assemblaggio dei DTO aggregati per il menu.
 *
 * Versione aggiornata: ora include il campo {@code traduzioni} in ogni PortataConProdottiDTO
 * (preso da Portata.traduzioni) e il campo traduzioni è già presente negli ProdottoDTO
 * e PiattoDelGiornoDTO tramite i relativi mapper.
 */
@Service
@Transactional(readOnly = true)
public class MenuCompletoService {

    private static final Logger LOG = LoggerFactory.getLogger(MenuCompletoService.class);

    private final MenuRepository menuRepository;
    private final PortataRepository portataRepository;
    private final MenuMapper menuMapper;
    private final PiattoDelGiornoMapper piattoDelGiornoMapper;
    private final PortataService portataService;
    private final ProdottoService prodottoService;
    private final ImmagineMenuService immagineMenuService;
    private final AllergeneService allergeneService;
    private final ListaContattiService listaContattiService;

    public MenuCompletoService(
        MenuRepository menuRepository,
        PortataRepository portataRepository,
        MenuMapper menuMapper,
        PiattoDelGiornoMapper piattoDelGiornoMapper,
        PortataService portataService,
        ProdottoService prodottoService,
        ImmagineMenuService immagineMenuService,
        AllergeneService allergeneService,
        ListaContattiService listaContattiService
    ) {
        this.menuRepository = menuRepository;
        this.portataRepository = portataRepository;
        this.menuMapper = menuMapper;
        this.piattoDelGiornoMapper = piattoDelGiornoMapper;
        this.portataService = portataService;
        this.prodottoService = prodottoService;
        this.immagineMenuService = immagineMenuService;
        this.allergeneService = allergeneService;
        this.listaContattiService = listaContattiService;
    }

    @Cacheable(value = "piattiGiorno", key = "#menuId")
    public List<PiattoDelGiornoDTO> findPiattiDelGiornoAttiviByMenuId(UUID menuId) {
        LOG.debug("Request to get active PiattiDelGiorno with allergenis for Menu : {}", menuId);

        List<PiattoDelGiorno> baseList = menuRepository.findPiattiDelGiornoAttiviByMenuId(menuId);
        menuRepository.findPiattiDelGiornoAttiviByMenuIdConAllergeniProdotto(menuId);
        menuRepository.findPiattiDelGiornoAttiviByMenuIdConAllergeniDiretti(menuId);

        return baseList.stream().map(piattoDelGiornoMapper::toDto).toList();
    }

    /**
     * Carica tutto il necessario per la vista pubblica in un'unica transazione.
     * Include le traduzioni DeepL pre-calcolate su Portata, Prodotto e PiattoDelGiorno.
     */
    @Cacheable(value = "menuCompleto", key = "#id")
    public Optional<MenuCompletoDTO> findMenuCompleto(UUID id) {
        LOG.debug("Request to get MenuCompleto (aggregato) : {}", id);

        Optional<MenuDTO> menuOpt = menuRepository.findOneWithEagerRelationships(id).map(menuMapper::toDto);
        if (menuOpt.isEmpty()) {
            return Optional.empty();
        }
        MenuDTO menu = menuOpt.get();

        // Prodotti raggruppati per portata — include già il campo traduzioni via mapper
        Map<UUID, List<ProdottoDTO>> prodottiPerPortata = prodottoService
            .findProdottiCompletiByMenuId(id)
            .stream()
            .collect(Collectors.groupingBy(p -> p.getPortata().getId()));

        // Lista delle entità Portata: ci serve per accedere direttamente al campo "traduzioni"
        List<Portata> portateEntities = portataRepository.findByMenuIdOrdered(id);

        List<PortataConProdottiDTO> portateConProdotti = portateEntities
            .stream()
            .map(portata ->
                new PortataConProdottiDTO(
                    portata.getId(),
                    portata.getTipo(),
                    portata.getNomeDefault(),
                    portata.getNomePersonalizzato(),
                    portata.getTraduzioni(),
                    prodottiPerPortata.getOrDefault(portata.getId(), List.of())
                )
            )
            .toList();

        List<PiattoDelGiornoDTO> piattiDelGiorno = findPiattiDelGiornoAttiviByMenuId(id);
        List<ImmagineMenuMetaDTO> immagini = immagineMenuService.findMetaByMenuId(id);
        List<AllergeneDTO> allergeni = allergeneService.findAll();
        List<ListaContattiDTO> contatti = listaContattiService.findByMenuId(id);

        return Optional.of(new MenuCompletoDTO(menu, portateConProdotti, piattiDelGiorno, immagini, allergeni, contatti));
    }
}
