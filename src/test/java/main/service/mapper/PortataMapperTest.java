package main.service.mapper;

import static main.domain.PortataAsserts.*;
import static main.domain.PortataTestSamples.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class PortataMapperTest {

    private PortataMapper portataMapper;

    @BeforeEach
    void setUp() {
        portataMapper = new PortataMapperImpl();
    }

    @Test
    void shouldConvertToDtoAndBack() {
        var expected = getPortataSample1();
        var actual = portataMapper.toEntity(portataMapper.toDto(expected));
        assertPortataAllPropertiesEquals(expected, actual);
    }
}
