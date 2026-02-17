package main.service.dto;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;
import main.web.rest.TestUtil;
import org.junit.jupiter.api.Test;

class MenuDTOTest {

    @Test
    void dtoEqualsVerifier() throws Exception {
        TestUtil.equalsVerifier(MenuDTO.class);
        MenuDTO menuDTO1 = new MenuDTO();
        menuDTO1.setId(UUID.randomUUID());
        MenuDTO menuDTO2 = new MenuDTO();
        assertThat(menuDTO1).isNotEqualTo(menuDTO2);
        menuDTO2.setId(menuDTO1.getId());
        assertThat(menuDTO1).isEqualTo(menuDTO2);
        menuDTO2.setId(UUID.randomUUID());
        assertThat(menuDTO1).isNotEqualTo(menuDTO2);
        menuDTO1.setId(null);
        assertThat(menuDTO1).isNotEqualTo(menuDTO2);
    }
}
