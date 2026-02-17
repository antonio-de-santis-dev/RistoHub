package main.web.rest;

import static main.domain.ProdottoAsserts.*;
import static main.web.rest.TestUtil.createUpdateProxyForBean;
import static main.web.rest.TestUtil.sameNumber;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.UUID;
import main.IntegrationTest;
import main.domain.Portata;
import main.domain.Prodotto;
import main.repository.ProdottoRepository;
import main.service.ProdottoService;
import main.service.dto.ProdottoDTO;
import main.service.mapper.ProdottoMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * Integration tests for the {@link ProdottoResource} REST controller.
 */
@IntegrationTest
@ExtendWith(MockitoExtension.class)
@AutoConfigureMockMvc
@WithMockUser
class ProdottoResourceIT {

    private static final String DEFAULT_NOME = "AAAAAAAAAA";
    private static final String UPDATED_NOME = "BBBBBBBBBB";

    private static final String DEFAULT_DESCRIZIONE = "AAAAAAAAAA";
    private static final String UPDATED_DESCRIZIONE = "BBBBBBBBBB";

    private static final BigDecimal DEFAULT_PREZZO = new BigDecimal(1);
    private static final BigDecimal UPDATED_PREZZO = new BigDecimal(2);

    private static final String ENTITY_API_URL = "/api/prodottos";
    private static final String ENTITY_API_URL_ID = ENTITY_API_URL + "/{id}";

    @Autowired
    private ObjectMapper om;

    @Autowired
    private ProdottoRepository prodottoRepository;

    @Mock
    private ProdottoRepository prodottoRepositoryMock;

    @Autowired
    private ProdottoMapper prodottoMapper;

    @Mock
    private ProdottoService prodottoServiceMock;

    @Autowired
    private EntityManager em;

    @Autowired
    private MockMvc restProdottoMockMvc;

    private Prodotto prodotto;

    private Prodotto insertedProdotto;

    /**
     * Create an entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static Prodotto createEntity(EntityManager em) {
        Prodotto prodotto = new Prodotto().nome(DEFAULT_NOME).descrizione(DEFAULT_DESCRIZIONE).prezzo(DEFAULT_PREZZO);
        // Add required entity
        Portata portata;
        if (TestUtil.findAll(em, Portata.class).isEmpty()) {
            portata = PortataResourceIT.createEntity(em);
            em.persist(portata);
            em.flush();
        } else {
            portata = TestUtil.findAll(em, Portata.class).get(0);
        }
        prodotto.setPortata(portata);
        return prodotto;
    }

    /**
     * Create an updated entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static Prodotto createUpdatedEntity(EntityManager em) {
        Prodotto updatedProdotto = new Prodotto().nome(UPDATED_NOME).descrizione(UPDATED_DESCRIZIONE).prezzo(UPDATED_PREZZO);
        // Add required entity
        Portata portata;
        if (TestUtil.findAll(em, Portata.class).isEmpty()) {
            portata = PortataResourceIT.createUpdatedEntity(em);
            em.persist(portata);
            em.flush();
        } else {
            portata = TestUtil.findAll(em, Portata.class).get(0);
        }
        updatedProdotto.setPortata(portata);
        return updatedProdotto;
    }

    @BeforeEach
    void initTest() {
        prodotto = createEntity(em);
    }

    @AfterEach
    void cleanup() {
        if (insertedProdotto != null) {
            prodottoRepository.delete(insertedProdotto);
            insertedProdotto = null;
        }
    }

    @Test
    @Transactional
    void createProdotto() throws Exception {
        long databaseSizeBeforeCreate = getRepositoryCount();
        // Create the Prodotto
        ProdottoDTO prodottoDTO = prodottoMapper.toDto(prodotto);
        var returnedProdottoDTO = om.readValue(
            restProdottoMockMvc
                .perform(
                    post(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(prodottoDTO))
                )
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString(),
            ProdottoDTO.class
        );

        // Validate the Prodotto in the database
        assertIncrementedRepositoryCount(databaseSizeBeforeCreate);
        var returnedProdotto = prodottoMapper.toEntity(returnedProdottoDTO);
        assertProdottoUpdatableFieldsEquals(returnedProdotto, getPersistedProdotto(returnedProdotto));

        insertedProdotto = returnedProdotto;
    }

    @Test
    @Transactional
    void createProdottoWithExistingId() throws Exception {
        // Create the Prodotto with an existing ID
        insertedProdotto = prodottoRepository.saveAndFlush(prodotto);
        ProdottoDTO prodottoDTO = prodottoMapper.toDto(prodotto);

        long databaseSizeBeforeCreate = getRepositoryCount();

        // An entity with an existing ID cannot be created, so this API call must fail
        restProdottoMockMvc
            .perform(post(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(prodottoDTO)))
            .andExpect(status().isBadRequest());

        // Validate the Prodotto in the database
        assertSameRepositoryCount(databaseSizeBeforeCreate);
    }

    @Test
    @Transactional
    void checkNomeIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        prodotto.setNome(null);

        // Create the Prodotto, which fails.
        ProdottoDTO prodottoDTO = prodottoMapper.toDto(prodotto);

        restProdottoMockMvc
            .perform(post(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(prodottoDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkPrezzoIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        prodotto.setPrezzo(null);

        // Create the Prodotto, which fails.
        ProdottoDTO prodottoDTO = prodottoMapper.toDto(prodotto);

        restProdottoMockMvc
            .perform(post(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(prodottoDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void getAllProdottos() throws Exception {
        // Initialize the database
        insertedProdotto = prodottoRepository.saveAndFlush(prodotto);

        // Get all the prodottoList
        restProdottoMockMvc
            .perform(get(ENTITY_API_URL + "?sort=id,desc"))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(prodotto.getId().toString())))
            .andExpect(jsonPath("$.[*].nome").value(hasItem(DEFAULT_NOME)))
            .andExpect(jsonPath("$.[*].descrizione").value(hasItem(DEFAULT_DESCRIZIONE)))
            .andExpect(jsonPath("$.[*].prezzo").value(hasItem(sameNumber(DEFAULT_PREZZO))));
    }

    @SuppressWarnings({ "unchecked" })
    void getAllProdottosWithEagerRelationshipsIsEnabled() throws Exception {
        when(prodottoServiceMock.findAllWithEagerRelationships(any())).thenReturn(new PageImpl(new ArrayList<>()));

        restProdottoMockMvc.perform(get(ENTITY_API_URL + "?eagerload=true")).andExpect(status().isOk());

        verify(prodottoServiceMock, times(1)).findAllWithEagerRelationships(any());
    }

    @SuppressWarnings({ "unchecked" })
    void getAllProdottosWithEagerRelationshipsIsNotEnabled() throws Exception {
        when(prodottoServiceMock.findAllWithEagerRelationships(any())).thenReturn(new PageImpl(new ArrayList<>()));

        restProdottoMockMvc.perform(get(ENTITY_API_URL + "?eagerload=false")).andExpect(status().isOk());
        verify(prodottoRepositoryMock, times(1)).findAll(any(Pageable.class));
    }

    @Test
    @Transactional
    void getProdotto() throws Exception {
        // Initialize the database
        insertedProdotto = prodottoRepository.saveAndFlush(prodotto);

        // Get the prodotto
        restProdottoMockMvc
            .perform(get(ENTITY_API_URL_ID, prodotto.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.id").value(prodotto.getId().toString()))
            .andExpect(jsonPath("$.nome").value(DEFAULT_NOME))
            .andExpect(jsonPath("$.descrizione").value(DEFAULT_DESCRIZIONE))
            .andExpect(jsonPath("$.prezzo").value(sameNumber(DEFAULT_PREZZO)));
    }

    @Test
    @Transactional
    void getNonExistingProdotto() throws Exception {
        // Get the prodotto
        restProdottoMockMvc.perform(get(ENTITY_API_URL_ID, UUID.randomUUID().toString())).andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    void putExistingProdotto() throws Exception {
        // Initialize the database
        insertedProdotto = prodottoRepository.saveAndFlush(prodotto);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the prodotto
        Prodotto updatedProdotto = prodottoRepository.findById(prodotto.getId()).orElseThrow();
        // Disconnect from session so that the updates on updatedProdotto are not directly saved in db
        em.detach(updatedProdotto);
        updatedProdotto.nome(UPDATED_NOME).descrizione(UPDATED_DESCRIZIONE).prezzo(UPDATED_PREZZO);
        ProdottoDTO prodottoDTO = prodottoMapper.toDto(updatedProdotto);

        restProdottoMockMvc
            .perform(
                put(ENTITY_API_URL_ID, prodottoDTO.getId())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(prodottoDTO))
            )
            .andExpect(status().isOk());

        // Validate the Prodotto in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertPersistedProdottoToMatchAllProperties(updatedProdotto);
    }

    @Test
    @Transactional
    void putNonExistingProdotto() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        prodotto.setId(UUID.randomUUID());

        // Create the Prodotto
        ProdottoDTO prodottoDTO = prodottoMapper.toDto(prodotto);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restProdottoMockMvc
            .perform(
                put(ENTITY_API_URL_ID, prodottoDTO.getId())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(prodottoDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Prodotto in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithIdMismatchProdotto() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        prodotto.setId(UUID.randomUUID());

        // Create the Prodotto
        ProdottoDTO prodottoDTO = prodottoMapper.toDto(prodotto);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restProdottoMockMvc
            .perform(
                put(ENTITY_API_URL_ID, UUID.randomUUID())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(prodottoDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Prodotto in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithMissingIdPathParamProdotto() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        prodotto.setId(UUID.randomUUID());

        // Create the Prodotto
        ProdottoDTO prodottoDTO = prodottoMapper.toDto(prodotto);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restProdottoMockMvc
            .perform(put(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(prodottoDTO)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the Prodotto in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void partialUpdateProdottoWithPatch() throws Exception {
        // Initialize the database
        insertedProdotto = prodottoRepository.saveAndFlush(prodotto);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the prodotto using partial update
        Prodotto partialUpdatedProdotto = new Prodotto();
        partialUpdatedProdotto.setId(prodotto.getId());

        partialUpdatedProdotto.nome(UPDATED_NOME);

        restProdottoMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedProdotto.getId())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedProdotto))
            )
            .andExpect(status().isOk());

        // Validate the Prodotto in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertProdottoUpdatableFieldsEquals(createUpdateProxyForBean(partialUpdatedProdotto, prodotto), getPersistedProdotto(prodotto));
    }

    @Test
    @Transactional
    void fullUpdateProdottoWithPatch() throws Exception {
        // Initialize the database
        insertedProdotto = prodottoRepository.saveAndFlush(prodotto);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the prodotto using partial update
        Prodotto partialUpdatedProdotto = new Prodotto();
        partialUpdatedProdotto.setId(prodotto.getId());

        partialUpdatedProdotto.nome(UPDATED_NOME).descrizione(UPDATED_DESCRIZIONE).prezzo(UPDATED_PREZZO);

        restProdottoMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedProdotto.getId())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedProdotto))
            )
            .andExpect(status().isOk());

        // Validate the Prodotto in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertProdottoUpdatableFieldsEquals(partialUpdatedProdotto, getPersistedProdotto(partialUpdatedProdotto));
    }

    @Test
    @Transactional
    void patchNonExistingProdotto() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        prodotto.setId(UUID.randomUUID());

        // Create the Prodotto
        ProdottoDTO prodottoDTO = prodottoMapper.toDto(prodotto);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restProdottoMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, prodottoDTO.getId())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(prodottoDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Prodotto in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithIdMismatchProdotto() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        prodotto.setId(UUID.randomUUID());

        // Create the Prodotto
        ProdottoDTO prodottoDTO = prodottoMapper.toDto(prodotto);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restProdottoMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, UUID.randomUUID())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(prodottoDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Prodotto in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithMissingIdPathParamProdotto() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        prodotto.setId(UUID.randomUUID());

        // Create the Prodotto
        ProdottoDTO prodottoDTO = prodottoMapper.toDto(prodotto);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restProdottoMockMvc
            .perform(
                patch(ENTITY_API_URL).with(csrf()).contentType("application/merge-patch+json").content(om.writeValueAsBytes(prodottoDTO))
            )
            .andExpect(status().isMethodNotAllowed());

        // Validate the Prodotto in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void deleteProdotto() throws Exception {
        // Initialize the database
        insertedProdotto = prodottoRepository.saveAndFlush(prodotto);

        long databaseSizeBeforeDelete = getRepositoryCount();

        // Delete the prodotto
        restProdottoMockMvc
            .perform(delete(ENTITY_API_URL_ID, prodotto.getId().toString()).with(csrf()).accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNoContent());

        // Validate the database contains one less item
        assertDecrementedRepositoryCount(databaseSizeBeforeDelete);
    }

    protected long getRepositoryCount() {
        return prodottoRepository.count();
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

    protected Prodotto getPersistedProdotto(Prodotto prodotto) {
        return prodottoRepository.findById(prodotto.getId()).orElseThrow();
    }

    protected void assertPersistedProdottoToMatchAllProperties(Prodotto expectedProdotto) {
        assertProdottoAllPropertiesEquals(expectedProdotto, getPersistedProdotto(expectedProdotto));
    }

    protected void assertPersistedProdottoToMatchUpdatableProperties(Prodotto expectedProdotto) {
        assertProdottoAllUpdatablePropertiesEquals(expectedProdotto, getPersistedProdotto(expectedProdotto));
    }
}
