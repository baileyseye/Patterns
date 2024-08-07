package baileyes.eyes.factory.factory.service;

public abstract class ToyFactory {

    public abstract PetToy createToy();

    public void someOperation() {
        PetToy toy = createToy();
        toy.use();
    }
}
