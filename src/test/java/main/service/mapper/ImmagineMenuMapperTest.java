package main.service.mapper;

import static main.domain.ImmagineMenuAsserts.*;
import static main.domain.ImmagineMenuTestSamples.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class ImmagineMenuMapperTest {

    private ImmagineMenuMapper immagineMenuMapper;

    @BeforeEach
    void setUp() {
        immagineMenuMapper = new ImmagineMenuMapperImpl();
    }

    @Test
    void shouldConvertToDtoAndBack() {
        var expected = getImmagineMenuSample1();
        var actual = immagineMenuMapper.toEntity(immagineMenuMapper.toDto(expected));
        assertImmagineMenuAllPropertiesEquals(expected, actual);
    }
}
