package main.domain;

import java.util.UUID;

public class MenuTestSamples {

    public static Menu getMenuSample1() {
        return new Menu()
            .id(UUID.fromString("23d8dc04-a48b-45d9-a01d-4b728f0ad4aa"))
            .nome("nome1")
            .descrizione("descrizione1")
            .templateStyle("templateStyle1")
            .colorePrimario("colorePrimario1")
            .coloreSecondario("coloreSecondario1")
            .fontMenu("fontMenu1");
    }

    public static Menu getMenuSample2() {
        return new Menu()
            .id(UUID.fromString("ad79f240-3727-46c3-b89f-2cf6ebd74367"))
            .nome("nome2")
            .descrizione("descrizione2")
            .templateStyle("templateStyle2")
            .colorePrimario("colorePrimario2")
            .coloreSecondario("coloreSecondario2")
            .fontMenu("fontMenu2");
    }

    public static Menu getMenuRandomSampleGenerator() {
        return new Menu()
            .id(UUID.randomUUID())
            .nome(UUID.randomUUID().toString())
            .descrizione(UUID.randomUUID().toString())
            .templateStyle(UUID.randomUUID().toString())
            .colorePrimario(UUID.randomUUID().toString())
            .coloreSecondario(UUID.randomUUID().toString())
            .fontMenu(UUID.randomUUID().toString());
    }
}
