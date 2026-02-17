package main.domain;

import static main.domain.MenuTestSamples.*;
import static main.domain.PortataTestSamples.*;
import static main.domain.ProdottoTestSamples.*;
import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashSet;
import java.util.Set;
import main.web.rest.TestUtil;
import org.junit.jupiter.api.Test;

class PortataTest {

    @Test
    void equalsVerifier() throws Exception {
        TestUtil.equalsVerifier(Portata.class);
        Portata portata1 = getPortataSample1();
        Portata portata2 = new Portata();
        assertThat(portata1).isNotEqualTo(portata2);

        portata2.setId(portata1.getId());
        assertThat(portata1).isEqualTo(portata2);

        portata2 = getPortataSample2();
        assertThat(portata1).isNotEqualTo(portata2);
    }

    @Test
    void prodottiTest() {
        Portata portata = getPortataRandomSampleGenerator();
        Prodotto prodottoBack = getProdottoRandomSampleGenerator();

        portata.addProdotti(prodottoBack);
        assertThat(portata.getProdottis()).containsOnly(prodottoBack);
        assertThat(prodottoBack.getPortata()).isEqualTo(portata);

        portata.removeProdotti(prodottoBack);
        assertThat(portata.getProdottis()).doesNotContain(prodottoBack);
        assertThat(prodottoBack.getPortata()).isNull();

        portata.prodottis(new HashSet<>(Set.of(prodottoBack)));
        assertThat(portata.getProdottis()).containsOnly(prodottoBack);
        assertThat(prodottoBack.getPortata()).isEqualTo(portata);

        portata.setProdottis(new HashSet<>());
        assertThat(portata.getProdottis()).doesNotContain(prodottoBack);
        assertThat(prodottoBack.getPortata()).isNull();
    }

    @Test
    void menuTest() {
        Portata portata = getPortataRandomSampleGenerator();
        Menu menuBack = getMenuRandomSampleGenerator();

        portata.setMenu(menuBack);
        assertThat(portata.getMenu()).isEqualTo(menuBack);

        portata.menu(null);
        assertThat(portata.getMenu()).isNull();
    }
}
