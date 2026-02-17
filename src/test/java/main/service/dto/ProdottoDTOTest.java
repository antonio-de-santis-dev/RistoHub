package main.service.dto;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;
import main.web.rest.TestUtil;
import org.junit.jupiter.api.Test;

class ProdottoDTOTest {

    @Test
    void dtoEqualsVerifier() throws Exception {
        TestUtil.equalsVerifier(ProdottoDTO.class);
        ProdottoDTO prodottoDTO1 = new ProdottoDTO();
        prodottoDTO1.setId(UUID.randomUUID());
        ProdottoDTO prodottoDTO2 = new ProdottoDTO();
        assertThat(prodottoDTO1).isNotEqualTo(prodottoDTO2);
        prodottoDTO2.setId(prodottoDTO1.getId());
        assertThat(prodottoDTO1).isEqualTo(prodottoDTO2);
        prodottoDTO2.setId(UUID.randomUUID());
        assertThat(prodottoDTO1).isNotEqualTo(prodottoDTO2);
        prodottoDTO1.setId(null);
        assertThat(prodottoDTO1).isNotEqualTo(prodottoDTO2);
    }
}
