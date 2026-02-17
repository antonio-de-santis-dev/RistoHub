package main.domain;

import static main.domain.AllergeneTestSamples.*;
import static main.domain.PortataTestSamples.*;
import static main.domain.ProdottoTestSamples.*;
import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashSet;
import java.util.Set;
import main.web.rest.TestUtil;
import org.junit.jupiter.api.Test;

class ProdottoTest {

    @Test
    void equalsVerifier() throws Exception {
        TestUtil.equalsVerifier(Prodotto.class);
        Prodotto prodotto1 = getProdottoSample1();
        Prodotto prodotto2 = new Prodotto();
        assertThat(prodotto1).isNotEqualTo(prodotto2);

        prodotto2.setId(prodotto1.getId());
        assertThat(prodotto1).isEqualTo(prodotto2);

        prodotto2 = getProdottoSample2();
        assertThat(prodotto1).isNotEqualTo(prodotto2);
    }

    @Test
    void allergeniTest() {
        Prodotto prodotto = getProdottoRandomSampleGenerator();
        Allergene allergeneBack = getAllergeneRandomSampleGenerator();

        prodotto.addAllergeni(allergeneBack);
        assertThat(prodotto.getAllergenis()).containsOnly(allergeneBack);

        prodotto.removeAllergeni(allergeneBack);
        assertThat(prodotto.getAllergenis()).doesNotContain(allergeneBack);

        prodotto.allergenis(new HashSet<>(Set.of(allergeneBack)));
        assertThat(prodotto.getAllergenis()).containsOnly(allergeneBack);

        prodotto.setAllergenis(new HashSet<>());
        assertThat(prodotto.getAllergenis()).doesNotContain(allergeneBack);
    }

    @Test
    void portataTest() {
        Prodotto prodotto = getProdottoRandomSampleGenerator();
        Portata portataBack = getPortataRandomSampleGenerator();

        prodotto.setPortata(portataBack);
        assertThat(prodotto.getPortata()).isEqualTo(portataBack);

        prodotto.portata(null);
        assertThat(prodotto.getPortata()).isNull();
    }
}
