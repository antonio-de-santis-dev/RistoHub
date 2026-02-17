package main.domain;

import java.util.UUID;

public class PortataTestSamples {

    public static Portata getPortataSample1() {
        return new Portata().id(UUID.fromString("23d8dc04-a48b-45d9-a01d-4b728f0ad4aa")).nomePersonalizzato("nomePersonalizzato1");
    }

    public static Portata getPortataSample2() {
        return new Portata().id(UUID.fromString("ad79f240-3727-46c3-b89f-2cf6ebd74367")).nomePersonalizzato("nomePersonalizzato2");
    }

    public static Portata getPortataRandomSampleGenerator() {
        return new Portata().id(UUID.randomUUID()).nomePersonalizzato(UUID.randomUUID().toString());
    }
}
