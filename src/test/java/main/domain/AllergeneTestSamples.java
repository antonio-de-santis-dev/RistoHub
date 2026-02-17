package main.domain;

import java.util.UUID;

public class AllergeneTestSamples {

    public static Allergene getAllergeneSample1() {
        return new Allergene().id(UUID.fromString("23d8dc04-a48b-45d9-a01d-4b728f0ad4aa")).nome("nome1").simbolo("simbolo1");
    }

    public static Allergene getAllergeneSample2() {
        return new Allergene().id(UUID.fromString("ad79f240-3727-46c3-b89f-2cf6ebd74367")).nome("nome2").simbolo("simbolo2");
    }

    public static Allergene getAllergeneRandomSampleGenerator() {
        return new Allergene().id(UUID.randomUUID()).nome(UUID.randomUUID().toString()).simbolo(UUID.randomUUID().toString());
    }
}
