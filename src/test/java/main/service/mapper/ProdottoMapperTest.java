package main.service.mapper;

import static main.domain.ProdottoAsserts.*;
import static main.domain.ProdottoTestSamples.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class ProdottoMapperTest {

    private ProdottoMapper prodottoMapper;

    @BeforeEach
    void setUp() {
        prodottoMapper = new ProdottoMapperImpl();
    }

    @Test
    void shouldConvertToDtoAndBack() {
        var expected = getProdottoSample1();
        var actual = prodottoMapper.toEntity(prodottoMapper.toDto(expected));
        assertProdottoAllPropertiesEquals(expected, actual);
    }
}
