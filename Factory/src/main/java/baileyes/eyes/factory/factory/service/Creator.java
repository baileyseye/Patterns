package baileyes.eyes.factory.factory.service;

public abstract class Creator {

    public abstract Product factoryMethod();

    public void someOperation() {
        Product product = factoryMethod();
        product.use();
    }
}
