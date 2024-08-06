package baileyes.eyes.factory.abstractfactory.service.impl.factory;

import baileyes.eyes.factory.abstractfactory.service.AbstractFactory;
import baileyes.eyes.factory.abstractfactory.service.ProductA;
import baileyes.eyes.factory.abstractfactory.service.ProductB;
import baileyes.eyes.factory.abstractfactory.service.impl.ConcreteProductA2;
import baileyes.eyes.factory.abstractfactory.service.impl.ConcreteProductB2;

public class ConcreteFactory2 implements AbstractFactory {

    @Override
    public ProductA createProductA() {
        return new ConcreteProductA2();
    }

    @Override
    public ProductB createProductB() {
        return new ConcreteProductB2();
    }
}