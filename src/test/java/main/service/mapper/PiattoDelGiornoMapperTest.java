package main.service.mapper;

import static main.domain.PiattoDelGiornoAsserts.*;
import static main.domain.PiattoDelGiornoTestSamples.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class PiattoDelGiornoMapperTest {

    private PiattoDelGiornoMapper piattoDelGiornoMapper;

    @BeforeEach
    void setUp() {
        piattoDelGiornoMapper = new PiattoDelGiornoMapperImpl();
    }

    @Test
    void shouldConvertToDtoAndBack() {
        var expected = getPiattoDelGiornoSample1();
        var actual = piattoDelGiornoMapper.toEntity(piattoDelGiornoMapper.toDto(expected));
        assertPiattoDelGiornoAllPropertiesEquals(expected, actual);
    }
}
