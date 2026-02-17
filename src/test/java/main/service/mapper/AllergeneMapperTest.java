package main.service.mapper;

import static main.domain.AllergeneAsserts.*;
import static main.domain.AllergeneTestSamples.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class AllergeneMapperTest {

    private AllergeneMapper allergeneMapper;

    @BeforeEach
    void setUp() {
        allergeneMapper = new AllergeneMapperImpl();
    }

    @Test
    void shouldConvertToDtoAndBack() {
        var expected = getAllergeneSample1();
        var actual = allergeneMapper.toEntity(allergeneMapper.toDto(expected));
        assertAllergeneAllPropertiesEquals(expected, actual);
    }
}
