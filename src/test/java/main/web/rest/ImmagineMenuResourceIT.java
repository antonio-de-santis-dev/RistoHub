package main.web.rest;

import static main.domain.ImmagineMenuAsserts.*;
import static main.web.rest.TestUtil.createUpdateProxyForBean;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import java.util.Base64;
import java.util.UUID;
import main.IntegrationTest;
import main.domain.ImmagineMenu;
import main.domain.Menu;
import main.domain.enumeration.TipoImmagine;
import main.repository.ImmagineMenuRepository;
import main.service.dto.ImmagineMenuDTO;
import main.service.mapper.ImmagineMenuMapper;
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
 * Integration tests for the {@link ImmagineMenuResource} REST controller.
 */
@IntegrationTest
@AutoConfigureMockMvc
@WithMockUser
class ImmagineMenuResourceIT {

    private static final String DEFAULT_NOME = "AAAAAAAAAA";
    private static final String UPDATED_NOME = "BBBBBBBBBB";

    private static final byte[] DEFAULT_IMMAGINE = TestUtil.createByteArray(1, "0");
    private static final byte[] UPDATED_IMMAGINE = TestUtil.createByteArray(1, "1");
    private static final String DEFAULT_IMMAGINE_CONTENT_TYPE = "image/jpg";
    private static final String UPDATED_IMMAGINE_CONTENT_TYPE = "image/png";

    private static final String DEFAULT_CONTENT_TYPE = "AAAAAAAAAA";
    private static final String UPDATED_CONTENT_TYPE = "BBBBBBBBBB";

    private static final TipoImmagine DEFAULT_TIPO = TipoImmagine.LOGO;
    private static final TipoImmagine UPDATED_TIPO = TipoImmagine.VETRINA;

    private static final String ENTITY_API_URL = "/api/immagine-menus";
    private static final String ENTITY_API_URL_ID = ENTITY_API_URL + "/{id}";

    @Autowired
    private ObjectMapper om;

    @Autowired
    private ImmagineMenuRepository immagineMenuRepository;

    @Autowired
    private ImmagineMenuMapper immagineMenuMapper;

    @Autowired
    private EntityManager em;

    @Autowired
    private MockMvc restImmagineMenuMockMvc;

    private ImmagineMenu immagineMenu;

    private ImmagineMenu insertedImmagineMenu;

    /**
     * Create an entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static ImmagineMenu createEntity(EntityManager em) {
        ImmagineMenu immagineMenu = new ImmagineMenu()
            .nome(DEFAULT_NOME)
            .immagine(DEFAULT_IMMAGINE)
            .immagineContentType(DEFAULT_IMMAGINE_CONTENT_TYPE)
            .contentType(DEFAULT_CONTENT_TYPE)
            .tipo(DEFAULT_TIPO);
        // Add required entity
        Menu menu;
        if (TestUtil.findAll(em, Menu.class).isEmpty()) {
            menu = MenuResourceIT.createEntity(em);
            em.persist(menu);
            em.flush();
        } else {
            menu = TestUtil.findAll(em, Menu.class).get(0);
        }
        immagineMenu.setMenu(menu);
        return immagineMenu;
    }

    /**
     * Create an updated entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static ImmagineMenu createUpdatedEntity(EntityManager em) {
        ImmagineMenu updatedImmagineMenu = new ImmagineMenu()
            .nome(UPDATED_NOME)
            .immagine(UPDATED_IMMAGINE)
            .immagineContentType(UPDATED_IMMAGINE_CONTENT_TYPE)
            .contentType(UPDATED_CONTENT_TYPE)
            .tipo(UPDATED_TIPO);
        // Add required entity
        Menu menu;
        if (TestUtil.findAll(em, Menu.class).isEmpty()) {
            menu = MenuResourceIT.createUpdatedEntity(em);
            em.persist(menu);
            em.flush();
        } else {
            menu = TestUtil.findAll(em, Menu.class).get(0);
        }
        updatedImmagineMenu.setMenu(menu);
        return updatedImmagineMenu;
    }

    @BeforeEach
    void initTest() {
        immagineMenu = createEntity(em);
    }

    @AfterEach
    void cleanup() {
        if (insertedImmagineMenu != null) {
            immagineMenuRepository.delete(insertedImmagineMenu);
            insertedImmagineMenu = null;
        }
    }

    @Test
    @Transactional
    void createImmagineMenu() throws Exception {
        long databaseSizeBeforeCreate = getRepositoryCount();
        // Create the ImmagineMenu
        ImmagineMenuDTO immagineMenuDTO = immagineMenuMapper.toDto(immagineMenu);
        var returnedImmagineMenuDTO = om.readValue(
            restImmagineMenuMockMvc
                .perform(
                    post(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(immagineMenuDTO))
                )
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString(),
            ImmagineMenuDTO.class
        );

        // Validate the ImmagineMenu in the database
        assertIncrementedRepositoryCount(databaseSizeBeforeCreate);
        var returnedImmagineMenu = immagineMenuMapper.toEntity(returnedImmagineMenuDTO);
        assertImmagineMenuUpdatableFieldsEquals(returnedImmagineMenu, getPersistedImmagineMenu(returnedImmagineMenu));

        insertedImmagineMenu = returnedImmagineMenu;
    }

    @Test
    @Transactional
    void createImmagineMenuWithExistingId() throws Exception {
        // Create the ImmagineMenu with an existing ID
        insertedImmagineMenu = immagineMenuRepository.saveAndFlush(immagineMenu);
        ImmagineMenuDTO immagineMenuDTO = immagineMenuMapper.toDto(immagineMenu);

        long databaseSizeBeforeCreate = getRepositoryCount();

        // An entity with an existing ID cannot be created, so this API call must fail
        restImmagineMenuMockMvc
            .perform(
                post(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(immagineMenuDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the ImmagineMenu in the database
        assertSameRepositoryCount(databaseSizeBeforeCreate);
    }

    @Test
    @Transactional
    void checkTipoIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        immagineMenu.setTipo(null);

        // Create the ImmagineMenu, which fails.
        ImmagineMenuDTO immagineMenuDTO = immagineMenuMapper.toDto(immagineMenu);

        restImmagineMenuMockMvc
            .perform(
                post(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(immagineMenuDTO))
            )
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void getAllImmagineMenus() throws Exception {
        // Initialize the database
        insertedImmagineMenu = immagineMenuRepository.saveAndFlush(immagineMenu);

        // Get all the immagineMenuList
        restImmagineMenuMockMvc
            .perform(get(ENTITY_API_URL + "?sort=id,desc"))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(immagineMenu.getId().toString())))
            .andExpect(jsonPath("$.[*].nome").value(hasItem(DEFAULT_NOME)))
            .andExpect(jsonPath("$.[*].immagineContentType").value(hasItem(DEFAULT_IMMAGINE_CONTENT_TYPE)))
            .andExpect(jsonPath("$.[*].immagine").value(hasItem(Base64.getEncoder().encodeToString(DEFAULT_IMMAGINE))))
            .andExpect(jsonPath("$.[*].contentType").value(hasItem(DEFAULT_CONTENT_TYPE)))
            .andExpect(jsonPath("$.[*].tipo").value(hasItem(DEFAULT_TIPO.toString())));
    }

    @Test
    @Transactional
    void getImmagineMenu() throws Exception {
        // Initialize the database
        insertedImmagineMenu = immagineMenuRepository.saveAndFlush(immagineMenu);

        // Get the immagineMenu
        restImmagineMenuMockMvc
            .perform(get(ENTITY_API_URL_ID, immagineMenu.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.id").value(immagineMenu.getId().toString()))
            .andExpect(jsonPath("$.nome").value(DEFAULT_NOME))
            .andExpect(jsonPath("$.immagineContentType").value(DEFAULT_IMMAGINE_CONTENT_TYPE))
            .andExpect(jsonPath("$.immagine").value(Base64.getEncoder().encodeToString(DEFAULT_IMMAGINE)))
            .andExpect(jsonPath("$.contentType").value(DEFAULT_CONTENT_TYPE))
            .andExpect(jsonPath("$.tipo").value(DEFAULT_TIPO.toString()));
    }

    @Test
    @Transactional
    void getNonExistingImmagineMenu() throws Exception {
        // Get the immagineMenu
        restImmagineMenuMockMvc.perform(get(ENTITY_API_URL_ID, UUID.randomUUID().toString())).andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    void putExistingImmagineMenu() throws Exception {
        // Initialize the database
        insertedImmagineMenu = immagineMenuRepository.saveAndFlush(immagineMenu);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the immagineMenu
        ImmagineMenu updatedImmagineMenu = immagineMenuRepository.findById(immagineMenu.getId()).orElseThrow();
        // Disconnect from session so that the updates on updatedImmagineMenu are not directly saved in db
        em.detach(updatedImmagineMenu);
        updatedImmagineMenu
            .nome(UPDATED_NOME)
            .immagine(UPDATED_IMMAGINE)
            .immagineContentType(UPDATED_IMMAGINE_CONTENT_TYPE)
            .contentType(UPDATED_CONTENT_TYPE)
            .tipo(UPDATED_TIPO);
        ImmagineMenuDTO immagineMenuDTO = immagineMenuMapper.toDto(updatedImmagineMenu);

        restImmagineMenuMockMvc
            .perform(
                put(ENTITY_API_URL_ID, immagineMenuDTO.getId())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(immagineMenuDTO))
            )
            .andExpect(status().isOk());

        // Validate the ImmagineMenu in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertPersistedImmagineMenuToMatchAllProperties(updatedImmagineMenu);
    }

    @Test
    @Transactional
    void putNonExistingImmagineMenu() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        immagineMenu.setId(UUID.randomUUID());

        // Create the ImmagineMenu
        ImmagineMenuDTO immagineMenuDTO = immagineMenuMapper.toDto(immagineMenu);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restImmagineMenuMockMvc
            .perform(
                put(ENTITY_API_URL_ID, immagineMenuDTO.getId())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(immagineMenuDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the ImmagineMenu in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithIdMismatchImmagineMenu() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        immagineMenu.setId(UUID.randomUUID());

        // Create the ImmagineMenu
        ImmagineMenuDTO immagineMenuDTO = immagineMenuMapper.toDto(immagineMenu);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restImmagineMenuMockMvc
            .perform(
                put(ENTITY_API_URL_ID, UUID.randomUUID())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(immagineMenuDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the ImmagineMenu in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithMissingIdPathParamImmagineMenu() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        immagineMenu.setId(UUID.randomUUID());

        // Create the ImmagineMenu
        ImmagineMenuDTO immagineMenuDTO = immagineMenuMapper.toDto(immagineMenu);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restImmagineMenuMockMvc
            .perform(
                put(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(immagineMenuDTO))
            )
            .andExpect(status().isMethodNotAllowed());

        // Validate the ImmagineMenu in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void partialUpdateImmagineMenuWithPatch() throws Exception {
        // Initialize the database
        insertedImmagineMenu = immagineMenuRepository.saveAndFlush(immagineMenu);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the immagineMenu using partial update
        ImmagineMenu partialUpdatedImmagineMenu = new ImmagineMenu();
        partialUpdatedImmagineMenu.setId(immagineMenu.getId());

        restImmagineMenuMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedImmagineMenu.getId())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedImmagineMenu))
            )
            .andExpect(status().isOk());

        // Validate the ImmagineMenu in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertImmagineMenuUpdatableFieldsEquals(
            createUpdateProxyForBean(partialUpdatedImmagineMenu, immagineMenu),
            getPersistedImmagineMenu(immagineMenu)
        );
    }

    @Test
    @Transactional
    void fullUpdateImmagineMenuWithPatch() throws Exception {
        // Initialize the database
        insertedImmagineMenu = immagineMenuRepository.saveAndFlush(immagineMenu);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the immagineMenu using partial update
        ImmagineMenu partialUpdatedImmagineMenu = new ImmagineMenu();
        partialUpdatedImmagineMenu.setId(immagineMenu.getId());

        partialUpdatedImmagineMenu
            .nome(UPDATED_NOME)
            .immagine(UPDATED_IMMAGINE)
            .immagineContentType(UPDATED_IMMAGINE_CONTENT_TYPE)
            .contentType(UPDATED_CONTENT_TYPE)
            .tipo(UPDATED_TIPO);

        restImmagineMenuMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedImmagineMenu.getId())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedImmagineMenu))
            )
            .andExpect(status().isOk());

        // Validate the ImmagineMenu in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertImmagineMenuUpdatableFieldsEquals(partialUpdatedImmagineMenu, getPersistedImmagineMenu(partialUpdatedImmagineMenu));
    }

    @Test
    @Transactional
    void patchNonExistingImmagineMenu() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        immagineMenu.setId(UUID.randomUUID());

        // Create the ImmagineMenu
        ImmagineMenuDTO immagineMenuDTO = immagineMenuMapper.toDto(immagineMenu);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restImmagineMenuMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, immagineMenuDTO.getId())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(immagineMenuDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the ImmagineMenu in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithIdMismatchImmagineMenu() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        immagineMenu.setId(UUID.randomUUID());

        // Create the ImmagineMenu
        ImmagineMenuDTO immagineMenuDTO = immagineMenuMapper.toDto(immagineMenu);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restImmagineMenuMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, UUID.randomUUID())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(immagineMenuDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the ImmagineMenu in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithMissingIdPathParamImmagineMenu() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        immagineMenu.setId(UUID.randomUUID());

        // Create the ImmagineMenu
        ImmagineMenuDTO immagineMenuDTO = immagineMenuMapper.toDto(immagineMenu);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restImmagineMenuMockMvc
            .perform(
                patch(ENTITY_API_URL)
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(immagineMenuDTO))
            )
            .andExpect(status().isMethodNotAllowed());

        // Validate the ImmagineMenu in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void deleteImmagineMenu() throws Exception {
        // Initialize the database
        insertedImmagineMenu = immagineMenuRepository.saveAndFlush(immagineMenu);

        long databaseSizeBeforeDelete = getRepositoryCount();

        // Delete the immagineMenu
        restImmagineMenuMockMvc
            .perform(delete(ENTITY_API_URL_ID, immagineMenu.getId().toString()).with(csrf()).accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNoContent());

        // Validate the database contains one less item
        assertDecrementedRepositoryCount(databaseSizeBeforeDelete);
    }

    protected long getRepositoryCount() {
        return immagineMenuRepository.count();
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

    protected ImmagineMenu getPersistedImmagineMenu(ImmagineMenu immagineMenu) {
        return immagineMenuRepository.findById(immagineMenu.getId()).orElseThrow();
    }

    protected void assertPersistedImmagineMenuToMatchAllProperties(ImmagineMenu expectedImmagineMenu) {
        assertImmagineMenuAllPropertiesEquals(expectedImmagineMenu, getPersistedImmagineMenu(expectedImmagineMenu));
    }

    protected void assertPersistedImmagineMenuToMatchUpdatableProperties(ImmagineMenu expectedImmagineMenu) {
        assertImmagineMenuAllUpdatablePropertiesEquals(expectedImmagineMenu, getPersistedImmagineMenu(expectedImmagineMenu));
    }
}
