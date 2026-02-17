package main.domain;

import static main.domain.AllergeneTestSamples.*;
import static main.domain.ProdottoTestSamples.*;
import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashSet;
import java.util.Set;
import main.web.rest.TestUtil;
import org.junit.jupiter.api.Test;

class AllergeneTest {

    @Test
    void equalsVerifier() throws Exception {
        TestUtil.equalsVerifier(Allergene.class);
        Allergene allergene1 = getAllergeneSample1();
        Allergene allergene2 = new Allergene();
        assertThat(allergene1).isNotEqualTo(allergene2);

        allergene2.setId(allergene1.getId());
        assertThat(allergene1).isEqualTo(allergene2);

        allergene2 = getAllergeneSample2();
        assertThat(allergene1).isNotEqualTo(allergene2);
    }

    @Test
    void prodottoTest() {
        Allergene allergene = getAllergeneRandomSampleGenerator();
        Prodotto prodottoBack = getProdottoRandomSampleGenerator();

        allergene.addProdotto(prodottoBack);
        assertThat(allergene.getProdottos()).containsOnly(prodottoBack);
        assertThat(prodottoBack.getAllergenis()).containsOnly(allergene);

        allergene.removeProdotto(prodottoBack);
        assertThat(allergene.getProdottos()).doesNotContain(prodottoBack);
        assertThat(prodottoBack.getAllergenis()).doesNotContain(allergene);

        allergene.prodottos(new HashSet<>(Set.of(prodottoBack)));
        assertThat(allergene.getProdottos()).containsOnly(prodottoBack);
        assertThat(prodottoBack.getAllergenis()).containsOnly(allergene);

        allergene.setProdottos(new HashSet<>());
        assertThat(allergene.getProdottos()).doesNotContain(prodottoBack);
        assertThat(prodottoBack.getAllergenis()).doesNotContain(allergene);
    }
}
