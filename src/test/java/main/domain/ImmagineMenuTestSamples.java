package main.domain;

import java.util.UUID;

public class ImmagineMenuTestSamples {

    public static ImmagineMenu getImmagineMenuSample1() {
        return new ImmagineMenu().id(UUID.fromString("23d8dc04-a48b-45d9-a01d-4b728f0ad4aa")).nome("nome1").contentType("contentType1");
    }

    public static ImmagineMenu getImmagineMenuSample2() {
        return new ImmagineMenu().id(UUID.fromString("ad79f240-3727-46c3-b89f-2cf6ebd74367")).nome("nome2").contentType("contentType2");
    }

    public static ImmagineMenu getImmagineMenuRandomSampleGenerator() {
        return new ImmagineMenu().id(UUID.randomUUID()).nome(UUID.randomUUID().toString()).contentType(UUID.randomUUID().toString());
    }
}
