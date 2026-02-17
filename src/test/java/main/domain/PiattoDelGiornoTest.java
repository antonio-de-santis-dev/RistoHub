package main.domain;

import static main.domain.PiattoDelGiornoTestSamples.*;
import static main.domain.ProdottoTestSamples.*;
import static org.assertj.core.api.Assertions.assertThat;

import main.web.rest.TestUtil;
import org.junit.jupiter.api.Test;

class PiattoDelGiornoTest {

    @Test
    void equalsVerifier() throws Exception {
        TestUtil.equalsVerifier(PiattoDelGiorno.class);
        PiattoDelGiorno piattoDelGiorno1 = getPiattoDelGiornoSample1();
        PiattoDelGiorno piattoDelGiorno2 = new PiattoDelGiorno();
        assertThat(piattoDelGiorno1).isNotEqualTo(piattoDelGiorno2);

        piattoDelGiorno2.setId(piattoDelGiorno1.getId());
        assertThat(piattoDelGiorno1).isEqualTo(piattoDelGiorno2);

        piattoDelGiorno2 = getPiattoDelGiornoSample2();
        assertThat(piattoDelGiorno1).isNotEqualTo(piattoDelGiorno2);
    }

    @Test
    void prodottoTest() {
        PiattoDelGiorno piattoDelGiorno = getPiattoDelGiornoRandomSampleGenerator();
        Prodotto prodottoBack = getProdottoRandomSampleGenerator();

        piattoDelGiorno.setProdotto(prodottoBack);
        assertThat(piattoDelGiorno.getProdotto()).isEqualTo(prodottoBack);

        piattoDelGiorno.prodotto(null);
        assertThat(piattoDelGiorno.getProdotto()).isNull();
    }
}
