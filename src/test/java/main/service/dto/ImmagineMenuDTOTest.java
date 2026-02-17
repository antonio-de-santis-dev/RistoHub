package main.service.dto;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;
import main.web.rest.TestUtil;
import org.junit.jupiter.api.Test;

class ImmagineMenuDTOTest {

    @Test
    void dtoEqualsVerifier() throws Exception {
        TestUtil.equalsVerifier(ImmagineMenuDTO.class);
        ImmagineMenuDTO immagineMenuDTO1 = new ImmagineMenuDTO();
        immagineMenuDTO1.setId(UUID.randomUUID());
        ImmagineMenuDTO immagineMenuDTO2 = new ImmagineMenuDTO();
        assertThat(immagineMenuDTO1).isNotEqualTo(immagineMenuDTO2);
        immagineMenuDTO2.setId(immagineMenuDTO1.getId());
        assertThat(immagineMenuDTO1).isEqualTo(immagineMenuDTO2);
        immagineMenuDTO2.setId(UUID.randomUUID());
        assertThat(immagineMenuDTO1).isNotEqualTo(immagineMenuDTO2);
        immagineMenuDTO1.setId(null);
        assertThat(immagineMenuDTO1).isNotEqualTo(immagineMenuDTO2);
    }
}
