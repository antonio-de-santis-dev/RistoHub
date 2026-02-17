package main.web.rest;

import static main.domain.PiattoDelGiornoAsserts.*;
import static main.web.rest.TestUtil.createUpdateProxyForBean;
import static main.web.rest.TestUtil.sameNumber;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.UUID;
import main.IntegrationTest;
import main.domain.PiattoDelGiorno;
import main.repository.PiattoDelGiornoRepository;
import main.service.dto.PiattoDelGiornoDTO;
import main.service.mapper.PiattoDelGiornoMapper;
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
 * Integration tests for the {@link PiattoDelGiornoResource} REST controller.
 */
@IntegrationTest
@AutoConfigureMockMvc
@WithMockUser
class PiattoDelGiornoResourceIT {

    private static final LocalDate DEFAULT_DATA = LocalDate.ofEpochDay(0L);
    private static final LocalDate UPDATED_DATA = LocalDate.now(ZoneId.systemDefault());

    private static final Boolean DEFAULT_ATTIVO = false;
    private static final Boolean UPDATED_ATTIVO = true;

    private static final String DEFAULT_NOME = "AAAAAAAAAA";
    private static final String UPDATED_NOME = "BBBBBBBBBB";

    private static final String DEFAULT_DESCRIZIONE = "AAAAAAAAAA";
    private static final String UPDATED_DESCRIZIONE = "BBBBBBBBBB";

    private static final BigDecimal DEFAULT_PREZZO = new BigDecimal(1);
    private static final BigDecimal UPDATED_PREZZO = new BigDecimal(2);

    private static final String ENTITY_API_URL = "/api/piatto-del-giornos";
    private static final String ENTITY_API_URL_ID = ENTITY_API_URL + "/{id}";

    @Autowired
    private ObjectMapper om;

    @Autowired
    private PiattoDelGiornoRepository piattoDelGiornoRepository;

    @Autowired
    private PiattoDelGiornoMapper piattoDelGiornoMapper;

    @Autowired
    private EntityManager em;

    @Autowired
    private MockMvc restPiattoDelGiornoMockMvc;

    private PiattoDelGiorno piattoDelGiorno;

    private PiattoDelGiorno insertedPiattoDelGiorno;

    /**
     * Create an entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static PiattoDelGiorno createEntity() {
        return new PiattoDelGiorno()
            .data(DEFAULT_DATA)
            .attivo(DEFAULT_ATTIVO)
            .nome(DEFAULT_NOME)
            .descrizione(DEFAULT_DESCRIZIONE)
            .prezzo(DEFAULT_PREZZO);
    }

    /**
     * Create an updated entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static PiattoDelGiorno createUpdatedEntity() {
        return new PiattoDelGiorno()
            .data(UPDATED_DATA)
            .attivo(UPDATED_ATTIVO)
            .nome(UPDATED_NOME)
            .descrizione(UPDATED_DESCRIZIONE)
            .prezzo(UPDATED_PREZZO);
    }

    @BeforeEach
    void initTest() {
        piattoDelGiorno = createEntity();
    }

    @AfterEach
    void cleanup() {
        if (insertedPiattoDelGiorno != null) {
            piattoDelGiornoRepository.delete(insertedPiattoDelGiorno);
            insertedPiattoDelGiorno = null;
        }
    }

    @Test
    @Transactional
    void createPiattoDelGiorno() throws Exception {
        long databaseSizeBeforeCreate = getRepositoryCount();
        // Create the PiattoDelGiorno
        PiattoDelGiornoDTO piattoDelGiornoDTO = piattoDelGiornoMapper.toDto(piattoDelGiorno);
        var returnedPiattoDelGiornoDTO = om.readValue(
            restPiattoDelGiornoMockMvc
                .perform(
                    post(ENTITY_API_URL)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsBytes(piattoDelGiornoDTO))
                )
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString(),
            PiattoDelGiornoDTO.class
        );

        // Validate the PiattoDelGiorno in the database
        assertIncrementedRepositoryCount(databaseSizeBeforeCreate);
        var returnedPiattoDelGiorno = piattoDelGiornoMapper.toEntity(returnedPiattoDelGiornoDTO);
        assertPiattoDelGiornoUpdatableFieldsEquals(returnedPiattoDelGiorno, getPersistedPiattoDelGiorno(returnedPiattoDelGiorno));

        insertedPiattoDelGiorno = returnedPiattoDelGiorno;
    }

    @Test
    @Transactional
    void createPiattoDelGiornoWithExistingId() throws Exception {
        // Create the PiattoDelGiorno with an existing ID
        insertedPiattoDelGiorno = piattoDelGiornoRepository.saveAndFlush(piattoDelGiorno);
        PiattoDelGiornoDTO piattoDelGiornoDTO = piattoDelGiornoMapper.toDto(piattoDelGiorno);

        long databaseSizeBeforeCreate = getRepositoryCount();

        // An entity with an existing ID cannot be created, so this API call must fail
        restPiattoDelGiornoMockMvc
            .perform(
                post(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(piattoDelGiornoDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the PiattoDelGiorno in the database
        assertSameRepositoryCount(databaseSizeBeforeCreate);
    }

    @Test
    @Transactional
    void checkDataIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        piattoDelGiorno.setData(null);

        // Create the PiattoDelGiorno, which fails.
        PiattoDelGiornoDTO piattoDelGiornoDTO = piattoDelGiornoMapper.toDto(piattoDelGiorno);

        restPiattoDelGiornoMockMvc
            .perform(
                post(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(piattoDelGiornoDTO))
            )
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkAttivoIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        piattoDelGiorno.setAttivo(null);

        // Create the PiattoDelGiorno, which fails.
        PiattoDelGiornoDTO piattoDelGiornoDTO = piattoDelGiornoMapper.toDto(piattoDelGiorno);

        restPiattoDelGiornoMockMvc
            .perform(
                post(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(piattoDelGiornoDTO))
            )
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void getAllPiattoDelGiornos() throws Exception {
        // Initialize the database
        insertedPiattoDelGiorno = piattoDelGiornoRepository.saveAndFlush(piattoDelGiorno);

        // Get all the piattoDelGiornoList
        restPiattoDelGiornoMockMvc
            .perform(get(ENTITY_API_URL + "?sort=id,desc"))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(piattoDelGiorno.getId().toString())))
            .andExpect(jsonPath("$.[*].data").value(hasItem(DEFAULT_DATA.toString())))
            .andExpect(jsonPath("$.[*].attivo").value(hasItem(DEFAULT_ATTIVO)))
            .andExpect(jsonPath("$.[*].nome").value(hasItem(DEFAULT_NOME)))
            .andExpect(jsonPath("$.[*].descrizione").value(hasItem(DEFAULT_DESCRIZIONE)))
            .andExpect(jsonPath("$.[*].prezzo").value(hasItem(sameNumber(DEFAULT_PREZZO))));
    }

    @Test
    @Transactional
    void getPiattoDelGiorno() throws Exception {
        // Initialize the database
        insertedPiattoDelGiorno = piattoDelGiornoRepository.saveAndFlush(piattoDelGiorno);

        // Get the piattoDelGiorno
        restPiattoDelGiornoMockMvc
            .perform(get(ENTITY_API_URL_ID, piattoDelGiorno.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.id").value(piattoDelGiorno.getId().toString()))
            .andExpect(jsonPath("$.data").value(DEFAULT_DATA.toString()))
            .andExpect(jsonPath("$.attivo").value(DEFAULT_ATTIVO))
            .andExpect(jsonPath("$.nome").value(DEFAULT_NOME))
            .andExpect(jsonPath("$.descrizione").value(DEFAULT_DESCRIZIONE))
            .andExpect(jsonPath("$.prezzo").value(sameNumber(DEFAULT_PREZZO)));
    }

    @Test
    @Transactional
    void getNonExistingPiattoDelGiorno() throws Exception {
        // Get the piattoDelGiorno
        restPiattoDelGiornoMockMvc.perform(get(ENTITY_API_URL_ID, UUID.randomUUID().toString())).andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    void putExistingPiattoDelGiorno() throws Exception {
        // Initialize the database
        insertedPiattoDelGiorno = piattoDelGiornoRepository.saveAndFlush(piattoDelGiorno);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the piattoDelGiorno
        PiattoDelGiorno updatedPiattoDelGiorno = piattoDelGiornoRepository.findById(piattoDelGiorno.getId()).orElseThrow();
        // Disconnect from session so that the updates on updatedPiattoDelGiorno are not directly saved in db
        em.detach(updatedPiattoDelGiorno);
        updatedPiattoDelGiorno
            .data(UPDATED_DATA)
            .attivo(UPDATED_ATTIVO)
            .nome(UPDATED_NOME)
            .descrizione(UPDATED_DESCRIZIONE)
            .prezzo(UPDATED_PREZZO);
        PiattoDelGiornoDTO piattoDelGiornoDTO = piattoDelGiornoMapper.toDto(updatedPiattoDelGiorno);

        restPiattoDelGiornoMockMvc
            .perform(
                put(ENTITY_API_URL_ID, piattoDelGiornoDTO.getId())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(piattoDelGiornoDTO))
            )
            .andExpect(status().isOk());

        // Validate the PiattoDelGiorno in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertPersistedPiattoDelGiornoToMatchAllProperties(updatedPiattoDelGiorno);
    }

    @Test
    @Transactional
    void putNonExistingPiattoDelGiorno() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        piattoDelGiorno.setId(UUID.randomUUID());

        // Create the PiattoDelGiorno
        PiattoDelGiornoDTO piattoDelGiornoDTO = piattoDelGiornoMapper.toDto(piattoDelGiorno);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restPiattoDelGiornoMockMvc
            .perform(
                put(ENTITY_API_URL_ID, piattoDelGiornoDTO.getId())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(piattoDelGiornoDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the PiattoDelGiorno in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithIdMismatchPiattoDelGiorno() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        piattoDelGiorno.setId(UUID.randomUUID());

        // Create the PiattoDelGiorno
        PiattoDelGiornoDTO piattoDelGiornoDTO = piattoDelGiornoMapper.toDto(piattoDelGiorno);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restPiattoDelGiornoMockMvc
            .perform(
                put(ENTITY_API_URL_ID, UUID.randomUUID())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(piattoDelGiornoDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the PiattoDelGiorno in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithMissingIdPathParamPiattoDelGiorno() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        piattoDelGiorno.setId(UUID.randomUUID());

        // Create the PiattoDelGiorno
        PiattoDelGiornoDTO piattoDelGiornoDTO = piattoDelGiornoMapper.toDto(piattoDelGiorno);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restPiattoDelGiornoMockMvc
            .perform(
                put(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(piattoDelGiornoDTO))
            )
            .andExpect(status().isMethodNotAllowed());

        // Validate the PiattoDelGiorno in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void partialUpdatePiattoDelGiornoWithPatch() throws Exception {
        // Initialize the database
        insertedPiattoDelGiorno = piattoDelGiornoRepository.saveAndFlush(piattoDelGiorno);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the piattoDelGiorno using partial update
        PiattoDelGiorno partialUpdatedPiattoDelGiorno = new PiattoDelGiorno();
        partialUpdatedPiattoDelGiorno.setId(piattoDelGiorno.getId());

        partialUpdatedPiattoDelGiorno.data(UPDATED_DATA).attivo(UPDATED_ATTIVO).nome(UPDATED_NOME).prezzo(UPDATED_PREZZO);

        restPiattoDelGiornoMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedPiattoDelGiorno.getId())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedPiattoDelGiorno))
            )
            .andExpect(status().isOk());

        // Validate the PiattoDelGiorno in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertPiattoDelGiornoUpdatableFieldsEquals(
            createUpdateProxyForBean(partialUpdatedPiattoDelGiorno, piattoDelGiorno),
            getPersistedPiattoDelGiorno(piattoDelGiorno)
        );
    }

    @Test
    @Transactional
    void fullUpdatePiattoDelGiornoWithPatch() throws Exception {
        // Initialize the database
        insertedPiattoDelGiorno = piattoDelGiornoRepository.saveAndFlush(piattoDelGiorno);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the piattoDelGiorno using partial update
        PiattoDelGiorno partialUpdatedPiattoDelGiorno = new PiattoDelGiorno();
        partialUpdatedPiattoDelGiorno.setId(piattoDelGiorno.getId());

        partialUpdatedPiattoDelGiorno
            .data(UPDATED_DATA)
            .attivo(UPDATED_ATTIVO)
            .nome(UPDATED_NOME)
            .descrizione(UPDATED_DESCRIZIONE)
            .prezzo(UPDATED_PREZZO);

        restPiattoDelGiornoMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedPiattoDelGiorno.getId())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedPiattoDelGiorno))
            )
            .andExpect(status().isOk());

        // Validate the PiattoDelGiorno in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertPiattoDelGiornoUpdatableFieldsEquals(
            partialUpdatedPiattoDelGiorno,
            getPersistedPiattoDelGiorno(partialUpdatedPiattoDelGiorno)
        );
    }

    @Test
    @Transactional
    void patchNonExistingPiattoDelGiorno() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        piattoDelGiorno.setId(UUID.randomUUID());

        // Create the PiattoDelGiorno
        PiattoDelGiornoDTO piattoDelGiornoDTO = piattoDelGiornoMapper.toDto(piattoDelGiorno);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restPiattoDelGiornoMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, piattoDelGiornoDTO.getId())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(piattoDelGiornoDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the PiattoDelGiorno in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithIdMismatchPiattoDelGiorno() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        piattoDelGiorno.setId(UUID.randomUUID());

        // Create the PiattoDelGiorno
        PiattoDelGiornoDTO piattoDelGiornoDTO = piattoDelGiornoMapper.toDto(piattoDelGiorno);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restPiattoDelGiornoMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, UUID.randomUUID())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(piattoDelGiornoDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the PiattoDelGiorno in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithMissingIdPathParamPiattoDelGiorno() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        piattoDelGiorno.setId(UUID.randomUUID());

        // Create the PiattoDelGiorno
        PiattoDelGiornoDTO piattoDelGiornoDTO = piattoDelGiornoMapper.toDto(piattoDelGiorno);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restPiattoDelGiornoMockMvc
            .perform(
                patch(ENTITY_API_URL)
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(piattoDelGiornoDTO))
            )
            .andExpect(status().isMethodNotAllowed());

        // Validate the PiattoDelGiorno in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void deletePiattoDelGiorno() throws Exception {
        // Initialize the database
        insertedPiattoDelGiorno = piattoDelGiornoRepository.saveAndFlush(piattoDelGiorno);

        long databaseSizeBeforeDelete = getRepositoryCount();

        // Delete the piattoDelGiorno
        restPiattoDelGiornoMockMvc
            .perform(delete(ENTITY_API_URL_ID, piattoDelGiorno.getId().toString()).with(csrf()).accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNoContent());

        // Validate the database contains one less item
        assertDecrementedRepositoryCount(databaseSizeBeforeDelete);
    }

    protected long getRepositoryCount() {
        return piattoDelGiornoRepository.count();
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

    protected PiattoDelGiorno getPersistedPiattoDelGiorno(PiattoDelGiorno piattoDelGiorno) {
        return piattoDelGiornoRepository.findById(piattoDelGiorno.getId()).orElseThrow();
    }

    protected void assertPersistedPiattoDelGiornoToMatchAllProperties(PiattoDelGiorno expectedPiattoDelGiorno) {
        assertPiattoDelGiornoAllPropertiesEquals(expectedPiattoDelGiorno, getPersistedPiattoDelGiorno(expectedPiattoDelGiorno));
    }

    protected void assertPersistedPiattoDelGiornoToMatchUpdatableProperties(PiattoDelGiorno expectedPiattoDelGiorno) {
        assertPiattoDelGiornoAllUpdatablePropertiesEquals(expectedPiattoDelGiorno, getPersistedPiattoDelGiorno(expectedPiattoDelGiorno));
    }
}
