package main.domain;

import static main.domain.ImmagineMenuTestSamples.*;
import static main.domain.MenuTestSamples.*;
import static main.domain.PortataTestSamples.*;
import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashSet;
import java.util.Set;
import main.web.rest.TestUtil;
import org.junit.jupiter.api.Test;

class MenuTest {

    @Test
    void equalsVerifier() throws Exception {
        TestUtil.equalsVerifier(Menu.class);
        Menu menu1 = getMenuSample1();
        Menu menu2 = new Menu();
        assertThat(menu1).isNotEqualTo(menu2);

        menu2.setId(menu1.getId());
        assertThat(menu1).isEqualTo(menu2);

        menu2 = getMenuSample2();
        assertThat(menu1).isNotEqualTo(menu2);
    }

    @Test
    void portateTest() {
        Menu menu = getMenuRandomSampleGenerator();
        Portata portataBack = getPortataRandomSampleGenerator();

        menu.addPortate(portataBack);
        assertThat(menu.getPortates()).containsOnly(portataBack);
        assertThat(portataBack.getMenu()).isEqualTo(menu);

        menu.removePortate(portataBack);
        assertThat(menu.getPortates()).doesNotContain(portataBack);
        assertThat(portataBack.getMenu()).isNull();

        menu.portates(new HashSet<>(Set.of(portataBack)));
        assertThat(menu.getPortates()).containsOnly(portataBack);
        assertThat(portataBack.getMenu()).isEqualTo(menu);

        menu.setPortates(new HashSet<>());
        assertThat(menu.getPortates()).doesNotContain(portataBack);
        assertThat(portataBack.getMenu()).isNull();
    }

    @Test
    void immaginiTest() {
        Menu menu = getMenuRandomSampleGenerator();
        ImmagineMenu immagineMenuBack = getImmagineMenuRandomSampleGenerator();

        menu.addImmagini(immagineMenuBack);
        assertThat(menu.getImmaginis()).containsOnly(immagineMenuBack);
        assertThat(immagineMenuBack.getMenu()).isEqualTo(menu);

        menu.removeImmagini(immagineMenuBack);
        assertThat(menu.getImmaginis()).doesNotContain(immagineMenuBack);
        assertThat(immagineMenuBack.getMenu()).isNull();

        menu.immaginis(new HashSet<>(Set.of(immagineMenuBack)));
        assertThat(menu.getImmaginis()).containsOnly(immagineMenuBack);
        assertThat(immagineMenuBack.getMenu()).isEqualTo(menu);

        menu.setImmaginis(new HashSet<>());
        assertThat(menu.getImmaginis()).doesNotContain(immagineMenuBack);
        assertThat(immagineMenuBack.getMenu()).isNull();
    }
}
