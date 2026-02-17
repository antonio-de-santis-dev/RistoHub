package main.web.rest;

import static main.domain.PortataAsserts.*;
import static main.web.rest.TestUtil.createUpdateProxyForBean;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import java.util.UUID;
import main.IntegrationTest;
import main.domain.Menu;
import main.domain.Portata;
import main.domain.enumeration.NomePortataDefault;
import main.domain.enumeration.TipoPortata;
import main.repository.PortataRepository;
import main.service.dto.PortataDTO;
import main.service.mapper.PortataMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * Integration tests for the {@link PortataResource} REST controller.
 */
@IntegrationTest
@AutoConfigureMockMvc
@WithMockUser
class PortataResourceIT {

    private static final TipoPortata DEFAULT_TIPO = TipoPortata.DEFAULT;
    private static final TipoPortata UPDATED_TIPO = TipoPortata.PERSONALIZZATA;

    private static final NomePortataDefault DEFAULT_NOME_DEFAULT = NomePortataDefault.ANTIPASTO;
    private static final NomePortataDefault UPDATED_NOME_DEFAULT = NomePortataDefault.PRIMO;

    private static final String DEFAULT_NOME_PERSONALIZZATO = "AAAAAAAAAA";
    private static final String UPDATED_NOME_PERSONALIZZATO = "BBBBBBBBBB";

    private static final String ENTITY_API_URL = "/api/portatas";
    private static final String ENTITY_API_URL_ID = ENTITY_API_URL + "/{id}";

    @Autowired
    private ObjectMapper om;

    @Autowired
    private PortataRepository portataRepository;

    @Autowired
    private PortataMapper portataMapper;

    @Autowired
    private EntityManager em;

    @Autowired
    private MockMvc restPortataMockMvc;

    private Portata portata;

    private Portata insertedPortata;

    /**
     * Create an entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static Portata createEntity(EntityManager em) {
        Portata portata = new Portata()
            .tipo(DEFAULT_TIPO)
            .nomeDefault(DEFAULT_NOME_DEFAULT)
            .nomePersonalizzato(DEFAULT_NOME_PERSONALIZZATO);
        // Add required entity
        Menu menu;
        if (TestUtil.findAll(em, Menu.class).isEmpty()) {
            menu = MenuResourceIT.createEntity(em);
            em.persist(menu);
            em.flush();
        } else {
            menu = TestUtil.findAll(em, Menu.class).get(0);
        }
        portata.setMenu(menu);
        return portata;
    }

    /**
     * Create an updated entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static Portata createUpdatedEntity(EntityManager em) {
        Portata updatedPortata = new Portata()
            .tipo(UPDATED_TIPO)
            .nomeDefault(UPDATED_NOME_DEFAULT)
            .nomePersonalizzato(UPDATED_NOME_PERSONALIZZATO);
        // Add required entity
        Menu menu;
        if (TestUtil.findAll(em, Menu.class).isEmpty()) {
            menu = MenuResourceIT.createUpdatedEntity(em);
            em.persist(menu);
            em.flush();
        } else {
            menu = TestUtil.findAll(em, Menu.class).get(0);
        }
        updatedPortata.setMenu(menu);
        return updatedPortata;
    }

    @BeforeEach
    void initTest() {
        portata = createEntity(em);
    }

    @AfterEach
    void cleanup() {
        if (insertedPortata != null) {
            portataRepository.delete(insertedPortata);
            insertedPortata = null;
        }
    }

    @Test
    @Transactional
    void createPortata() throws Exception {
        long databaseSizeBeforeCreate = getRepositoryCount();
        // Create the Portata
        PortataDTO portataDTO = portataMapper.toDto(portata);
        var returnedPortataDTO = om.readValue(
            restPortataMockMvc
                .perform(
                    post(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(portataDTO))
                )
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString(),
            PortataDTO.class
        );

        // Validate the Portata in the database
        assertIncrementedRepositoryCount(databaseSizeBeforeCreate);
        var returnedPortata = portataMapper.toEntity(returnedPortataDTO);
        assertPortataUpdatableFieldsEquals(returnedPortata, getPersistedPortata(returnedPortata));

        insertedPortata = returnedPortata;
    }

    @Test
    @Transactional
    void createPortataWithExistingId() throws Exception {
        // Create the Portata with an existing ID
        insertedPortata = portataRepository.saveAndFlush(portata);
        PortataDTO portataDTO = portataMapper.toDto(portata);

        long databaseSizeBeforeCreate = getRepositoryCount();

        // An entity with an existing ID cannot be created, so this API call must fail
        restPortataMockMvc
            .perform(post(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(portataDTO)))
            .andExpect(status().isBadRequest());

        // Validate the Portata in the database
        assertSameRepositoryCount(databaseSizeBeforeCreate);
    }

    @Test
    @Transactional
    void checkTipoIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        portata.setTipo(null);

        // Create the Portata, which fails.
        PortataDTO portataDTO = portataMapper.toDto(portata);

        restPortataMockMvc
            .perform(post(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(portataDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void getAllPortatas() throws Exception {
        // Initialize the database
        insertedPortata = portataRepository.saveAndFlush(portata);

        // Get all the portataList
        restPortataMockMvc
            .perform(get(ENTITY_API_URL + "?sort=id,desc"))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(portata.getId().toString())))
            .andExpect(jsonPath("$.[*].tipo").value(hasItem(DEFAULT_TIPO.toString())))
            .andExpect(jsonPath("$.[*].nomeDefault").value(hasItem(DEFAULT_NOME_DEFAULT.toString())))
            .andExpect(jsonPath("$.[*].nomePersonalizzato").value(hasItem(DEFAULT_NOME_PERSONALIZZATO)));
    }

    @Test
    @Transactional
    void getPortata() throws Exception {
        // Initialize the database
        insertedPortata = portataRepository.saveAndFlush(portata);

        // Get the portata
        restPortataMockMvc
            .perform(get(ENTITY_API_URL_ID, portata.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.id").value(portata.getId().toString()))
            .andExpect(jsonPath("$.tipo").value(DEFAULT_TIPO.toString()))
            .andExpect(jsonPath("$.nomeDefault").value(DEFAULT_NOME_DEFAULT.toString()))
            .andExpect(jsonPath("$.nomePersonalizzato").value(DEFAULT_NOME_PERSONALIZZATO));
    }

    @Test
    @Transactional
    void getNonExistingPortata() throws Exception {
        // Get the portata
        restPortataMockMvc.perform(get(ENTITY_API_URL_ID, UUID.randomUUID().toString())).andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    void putExistingPortata() throws Exception {
        // Initialize the database
        insertedPortata = portataRepository.saveAndFlush(portata);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the portata
        Portata updatedPortata = portataRepository.findById(portata.getId()).orElseThrow();
        // Disconnect from session so that the updates on updatedPortata are not directly saved in db
        em.detach(updatedPortata);
        updatedPortata.tipo(UPDATED_TIPO).nomeDefault(UPDATED_NOME_DEFAULT).nomePersonalizzato(UPDATED_NOME_PERSONALIZZATO);
        PortataDTO portataDTO = portataMapper.toDto(updatedPortata);

        restPortataMockMvc
            .perform(
                put(ENTITY_API_URL_ID, portataDTO.getId())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(portataDTO))
            )
            .andExpect(status().isOk());

        // Validate the Portata in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertPersistedPortataToMatchAllProperties(updatedPortata);
    }

    @Test
    @Transactional
    void putNonExistingPortata() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        portata.setId(UUID.randomUUID());

        // Create the Portata
        PortataDTO portataDTO = portataMapper.toDto(portata);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restPortataMockMvc
            .perform(
                put(ENTITY_API_URL_ID, portataDTO.getId())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(portataDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Portata in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithIdMismatchPortata() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        portata.setId(UUID.randomUUID());

        // Create the Portata
        PortataDTO portataDTO = portataMapper.toDto(portata);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restPortataMockMvc
            .perform(
                put(ENTITY_API_URL_ID, UUID.randomUUID())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(portataDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Portata in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithMissingIdPathParamPortata() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        portata.setId(UUID.randomUUID());

        // Create the Portata
        PortataDTO portataDTO = portataMapper.toDto(portata);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restPortataMockMvc
            .perform(put(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(portataDTO)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the Portata in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void partialUpdatePortataWithPatch() throws Exception {
        // Initialize the database
        insertedPortata = portataRepository.saveAndFlush(portata);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the portata using partial update
        Portata partialUpdatedPortata = new Portata();
        partialUpdatedPortata.setId(portata.getId());

        partialUpdatedPortata.tipo(UPDATED_TIPO);

        restPortataMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedPortata.getId())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedPortata))
            )
            .andExpect(status().isOk());

        // Validate the Portata in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertPortataUpdatableFieldsEquals(createUpdateProxyForBean(partialUpdatedPortata, portata), getPersistedPortata(portata));
    }

    @Test
    @Transactional
    void fullUpdatePortataWithPatch() throws Exception {
        // Initialize the database
        insertedPortata = portataRepository.saveAndFlush(portata);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the portata using partial update
        Portata partialUpdatedPortata = new Portata();
        partialUpdatedPortata.setId(portata.getId());

        partialUpdatedPortata.tipo(UPDATED_TIPO).nomeDefault(UPDATED_NOME_DEFAULT).nomePersonalizzato(UPDATED_NOME_PERSONALIZZATO);

        restPortataMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedPortata.getId())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedPortata))
            )
            .andExpect(status().isOk());

        // Validate the Portata in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertPortataUpdatableFieldsEquals(partialUpdatedPortata, getPersistedPortata(partialUpdatedPortata));
    }

    @Test
    @Transactional
    void patchNonExistingPortata() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        portata.setId(UUID.randomUUID());

        // Create the Portata
        PortataDTO portataDTO = portataMapper.toDto(portata);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restPortataMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, portataDTO.getId())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(portataDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Portata in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithIdMismatchPortata() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        portata.setId(UUID.randomUUID());

        // Create the Portata
        PortataDTO portataDTO = portataMapper.toDto(portata);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restPortataMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, UUID.randomUUID())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(portataDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Portata in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithMissingIdPathParamPortata() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        portata.setId(UUID.randomUUID());

        // Create the Portata
        PortataDTO portataDTO = portataMapper.toDto(portata);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restPortataMockMvc
            .perform(
                patch(ENTITY_API_URL).with(csrf()).contentType("application/merge-patch+json").content(om.writeValueAsBytes(portataDTO))
            )
            .andExpect(status().isMethodNotAllowed());

        // Validate the Portata in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void deletePortata() throws Exception {
        // Initialize the database
        insertedPortata = portataRepository.saveAndFlush(portata);

        long databaseSizeBeforeDelete = getRepositoryCount();

        // Delete the portata
        restPortataMockMvc
            .perform(delete(ENTITY_API_URL_ID, portata.getId().toString()).with(csrf()).accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNoContent());

        // Validate the database contains one less item
        assertDecrementedRepositoryCount(databaseSizeBeforeDelete);
    }

    protected long getRepositoryCount() {
        return portataRepository.count();
    }

    protected void assertIncrementedRepositoryCount(long countBefore) {
        assertThat(countBefore + 1).isEqualTo(getRepositoryCount());
    }

    protected void assertDecrementedRepositoryCount(long countBefore) {
        assertThat(countBefore - 1).isEqualTo(getRepositoryCount());
    }

    protected void assertSameRepositoryCount(long countBefore) {
        assertThat(countBefore).isEqualTo(getRepositoryCount());
    }

    protected Portata getPersistedPortata(Portata portata) {
        return portataRepository.findById(portata.getId()).orElseThrow();
    }

    protected void assertPersistedPortataToMatchAllProperties(Portata expectedPortata) {
        assertPortataAllPropertiesEquals(expectedPortata, getPersistedPortata(expectedPortata));
    }

    protected void assertPersistedPortataToMatchUpdatableProperties(Portata expectedPortata) {
        assertPortataAllUpdatablePropertiesEquals(expectedPortata, getPersistedPortata(expectedPortata));
    }
}
