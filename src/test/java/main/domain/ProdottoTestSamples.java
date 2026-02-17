package main.domain;

import java.util.UUID;

public class ProdottoTestSamples {

    public static Prodotto getProdottoSample1() {
        return new Prodotto().id(UUID.fromString("23d8dc04-a48b-45d9-a01d-4b728f0ad4aa")).nome("nome1").descrizione("descrizione1");
    }

    public static Prodotto getProdottoSample2() {
        return new Prodotto().id(UUID.fromString("ad79f240-3727-46c3-b89f-2cf6ebd74367")).nome("nome2").descrizione("descrizione2");
    }

    public static Prodotto getProdottoRandomSampleGenerator() {
        return new Prodotto().id(UUID.randomUUID()).nome(UUID.randomUUID().toString()).descrizione(UUID.randomUUID().toString());
    }
}
