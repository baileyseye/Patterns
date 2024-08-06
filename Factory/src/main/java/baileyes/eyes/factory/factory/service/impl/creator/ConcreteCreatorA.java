package baileyes.eyes.factory.factory.service.impl.creator;

import baileyes.eyes.factory.factory.service.Creator;
import baileyes.eyes.factory.factory.service.Product;
import baileyes.eyes.factory.factory.service.impl.ConcreteProductA;

public class ConcreteCreatorA extends Creator {

    @Override
    public Product factoryMethod() {
        return new ConcreteProductA();
    }
}
