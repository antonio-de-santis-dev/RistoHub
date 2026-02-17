package main.domain;

import static main.domain.ImmagineMenuTestSamples.*;
import static main.domain.MenuTestSamples.*;
import static org.assertj.core.api.Assertions.assertThat;

import main.web.rest.TestUtil;
import org.junit.jupiter.api.Test;

class ImmagineMenuTest {

    @Test
    void equalsVerifier() throws Exception {
        TestUtil.equalsVerifier(ImmagineMenu.class);
        ImmagineMenu immagineMenu1 = getImmagineMenuSample1();
        ImmagineMenu immagineMenu2 = new ImmagineMenu();
        assertThat(immagineMenu1).isNotEqualTo(immagineMenu2);

        immagineMenu2.setId(immagineMenu1.getId());
        assertThat(immagineMenu1).isEqualTo(immagineMenu2);

        immagineMenu2 = getImmagineMenuSample2();
        assertThat(immagineMenu1).isNotEqualTo(immagineMenu2);
    }

    @Test
    void menuTest() {
        ImmagineMenu immagineMenu = getImmagineMenuRandomSampleGenerator();
        Menu menuBack = getMenuRandomSampleGenerator();

        immagineMenu.setMenu(menuBack);
        assertThat(immagineMenu.getMenu()).isEqualTo(menuBack);

        immagineMenu.menu(null);
        assertThat(immagineMenu.getMenu()).isNull();
    }
}
