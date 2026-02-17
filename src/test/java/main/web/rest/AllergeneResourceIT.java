package main.web.rest;

import static main.domain.AllergeneAsserts.*;
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
import main.domain.Allergene;
import main.repository.AllergeneRepository;
import main.service.dto.AllergeneDTO;
import main.service.mapper.AllergeneMapper;
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
 * Integration tests for the {@link AllergeneResource} REST controller.
 */
@IntegrationTest
@AutoConfigureMockMvc
@WithMockUser
class AllergeneResourceIT {

    private static final String DEFAULT_NOME = "AAAAAAAAAA";
    private static final String UPDATED_NOME = "BBBBBBBBBB";

    private static final String DEFAULT_SIMBOLO = "AAAAAAAAAA";
    private static final String UPDATED_SIMBOLO = "BBBBBBBBBB";

    private static final String ENTITY_API_URL = "/api/allergenes";
    private static final String ENTITY_API_URL_ID = ENTITY_API_URL + "/{id}";

    @Autowired
    private ObjectMapper om;

    @Autowired
    private AllergeneRepository allergeneRepository;

    @Autowired
    private AllergeneMapper allergeneMapper;

    @Autowired
    private EntityManager em;

    @Autowired
    private MockMvc restAllergeneMockMvc;

    private Allergene allergene;

    private Allergene insertedAllergene;

    /**
     * Create an entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static Allergene createEntity() {
        return new Allergene().nome(DEFAULT_NOME).simbolo(DEFAULT_SIMBOLO);
    }

    /**
     * Create an updated entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static Allergene createUpdatedEntity() {
        return new Allergene().nome(UPDATED_NOME).simbolo(UPDATED_SIMBOLO);
    }

    @BeforeEach
    void initTest() {
        allergene = createEntity();
    }

    @AfterEach
    void cleanup() {
        if (insertedAllergene != null) {
            allergeneRepository.delete(insertedAllergene);
            insertedAllergene = null;
        }
    }

    @Test
    @Transactional
    void createAllergene() throws Exception {
        long databaseSizeBeforeCreate = getRepositoryCount();
        // Create the Allergene
        AllergeneDTO allergeneDTO = allergeneMapper.toDto(allergene);
        var returnedAllergeneDTO = om.readValue(
            restAllergeneMockMvc
                .perform(
                    post(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(allergeneDTO))
                )
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString(),
            AllergeneDTO.class
        );

        // Validate the Allergene in the database
        assertIncrementedRepositoryCount(databaseSizeBeforeCreate);
        var returnedAllergene = allergeneMapper.toEntity(returnedAllergeneDTO);
        assertAllergeneUpdatableFieldsEquals(returnedAllergene, getPersistedAllergene(returnedAllergene));

        insertedAllergene = returnedAllergene;
    }

    @Test
    @Transactional
    void createAllergeneWithExistingId() throws Exception {
        // Create the Allergene with an existing ID
        insertedAllergene = allergeneRepository.saveAndFlush(allergene);
        AllergeneDTO allergeneDTO = allergeneMapper.toDto(allergene);

        long databaseSizeBeforeCreate = getRepositoryCount();

        // An entity with an existing ID cannot be created, so this API call must fail
        restAllergeneMockMvc
            .perform(post(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(allergeneDTO)))
            .andExpect(status().isBadRequest());

        // Validate the Allergene in the database
        assertSameRepositoryCount(databaseSizeBeforeCreate);
    }

    @Test
    @Transactional
    void checkNomeIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        allergene.setNome(null);

        // Create the Allergene, which fails.
        AllergeneDTO allergeneDTO = allergeneMapper.toDto(allergene);

        restAllergeneMockMvc
            .perform(post(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(allergeneDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void getAllAllergenes() throws Exception {
        // Initialize the database
        insertedAllergene = allergeneRepository.saveAndFlush(allergene);

        // Get all the allergeneList
        restAllergeneMockMvc
            .perform(get(ENTITY_API_URL + "?sort=id,desc"))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(allergene.getId().toString())))
            .andExpect(jsonPath("$.[*].nome").value(hasItem(DEFAULT_NOME)))
            .andExpect(jsonPath("$.[*].simbolo").value(hasItem(DEFAULT_SIMBOLO)));
    }

    @Test
    @Transactional
    void getAllergene() throws Exception {
        // Initialize the database
        insertedAllergene = allergeneRepository.saveAndFlush(allergene);

        // Get the allergene
        restAllergeneMockMvc
            .perform(get(ENTITY_API_URL_ID, allergene.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.id").value(allergene.getId().toString()))
            .andExpect(jsonPath("$.nome").value(DEFAULT_NOME))
            .andExpect(jsonPath("$.simbolo").value(DEFAULT_SIMBOLO));
    }

    @Test
    @Transactional
    void getNonExistingAllergene() throws Exception {
        // Get the allergene
        restAllergeneMockMvc.perform(get(ENTITY_API_URL_ID, UUID.randomUUID().toString())).andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    void putExistingAllergene() throws Exception {
        // Initialize the database
        insertedAllergene = allergeneRepository.saveAndFlush(allergene);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the allergene
        Allergene updatedAllergene = allergeneRepository.findById(allergene.getId()).orElseThrow();
        // Disconnect from session so that the updates on updatedAllergene are not directly saved in db
        em.detach(updatedAllergene);
        updatedAllergene.nome(UPDATED_NOME).simbolo(UPDATED_SIMBOLO);
        AllergeneDTO allergeneDTO = allergeneMapper.toDto(updatedAllergene);

        restAllergeneMockMvc
            .perform(
                put(ENTITY_API_URL_ID, allergeneDTO.getId())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(allergeneDTO))
            )
            .andExpect(status().isOk());

        // Validate the Allergene in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertPersistedAllergeneToMatchAllProperties(updatedAllergene);
    }

    @Test
    @Transactional
    void putNonExistingAllergene() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        allergene.setId(UUID.randomUUID());

        // Create the Allergene
        AllergeneDTO allergeneDTO = allergeneMapper.toDto(allergene);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restAllergeneMockMvc
            .perform(
                put(ENTITY_API_URL_ID, allergeneDTO.getId())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(allergeneDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Allergene in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithIdMismatchAllergene() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        allergene.setId(UUID.randomUUID());

        // Create the Allergene
        AllergeneDTO allergeneDTO = allergeneMapper.toDto(allergene);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restAllergeneMockMvc
            .perform(
                put(ENTITY_API_URL_ID, UUID.randomUUID())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(allergeneDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Allergene in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithMissingIdPathParamAllergene() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        allergene.setId(UUID.randomUUID());

        // Create the Allergene
        AllergeneDTO allergeneDTO = allergeneMapper.toDto(allergene);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restAllergeneMockMvc
            .perform(put(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(allergeneDTO)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the Allergene in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void partialUpdateAllergeneWithPatch() throws Exception {
        // Initialize the database
        insertedAllergene = allergeneRepository.saveAndFlush(allergene);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the allergene using partial update
        Allergene partialUpdatedAllergene = new Allergene();
        partialUpdatedAllergene.setId(allergene.getId());

        restAllergeneMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedAllergene.getId())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedAllergene))
            )
            .andExpect(status().isOk());

        // Validate the Allergene in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertAllergeneUpdatableFieldsEquals(
            createUpdateProxyForBean(partialUpdatedAllergene, allergene),
            getPersistedAllergene(allergene)
        );
    }

    @Test
    @Transactional
    void fullUpdateAllergeneWithPatch() throws Exception {
        // Initialize the database
        insertedAllergene = allergeneRepository.saveAndFlush(allergene);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the allergene using partial update
        Allergene partialUpdatedAllergene = new Allergene();
        partialUpdatedAllergene.setId(allergene.getId());

        partialUpdatedAllergene.nome(UPDATED_NOME).simbolo(UPDATED_SIMBOLO);

        restAllergeneMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedAllergene.getId())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedAllergene))
            )
            .andExpect(status().isOk());

        // Validate the Allergene in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertAllergeneUpdatableFieldsEquals(partialUpdatedAllergene, getPersistedAllergene(partialUpdatedAllergene));
    }

    @Test
    @Transactional
    void patchNonExistingAllergene() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        allergene.setId(UUID.randomUUID());

        // Create the Allergene
        AllergeneDTO allergeneDTO = allergeneMapper.toDto(allergene);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restAllergeneMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, allergeneDTO.getId())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(allergeneDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Allergene in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithIdMismatchAllergene() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        allergene.setId(UUID.randomUUID());

        // Create the Allergene
        AllergeneDTO allergeneDTO = allergeneMapper.toDto(allergene);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restAllergeneMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, UUID.randomUUID())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(allergeneDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Allergene in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithMissingIdPathParamAllergene() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        allergene.setId(UUID.randomUUID());

        // Create the Allergene
        AllergeneDTO allergeneDTO = allergeneMapper.toDto(allergene);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restAllergeneMockMvc
            .perform(
                patch(ENTITY_API_URL).with(csrf()).contentType("application/merge-patch+json").content(om.writeValueAsBytes(allergeneDTO))
            )
            .andExpect(status().isMethodNotAllowed());

        // Validate the Allergene in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void deleteAllergene() throws Exception {
        // Initialize the database
        insertedAllergene = allergeneRepository.saveAndFlush(allergene);

        long databaseSizeBeforeDelete = getRepositoryCount();

        // Delete the allergene
        restAllergeneMockMvc
            .perform(delete(ENTITY_API_URL_ID, allergene.getId().toString()).with(csrf()).accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNoContent());

        // Validate the database contains one less item
        assertDecrementedRepositoryCount(databaseSizeBeforeDelete);
    }

    protected long getRepositoryCount() {
        return allergeneRepository.count();
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

    protected Allergene getPersistedAllergene(Allergene allergene) {
        return allergeneRepository.findById(allergene.getId()).orElseThrow();
    }

    protected void assertPersistedAllergeneToMatchAllProperties(Allergene expectedAllergene) {
        assertAllergeneAllPropertiesEquals(expectedAllergene, getPersistedAllergene(expectedAllergene));
    }

    protected void assertPersistedAllergeneToMatchUpdatableProperties(Allergene expectedAllergene) {
        assertAllergeneAllUpdatablePropertiesEquals(expectedAllergene, getPersistedAllergene(expectedAllergene));
    }
}
