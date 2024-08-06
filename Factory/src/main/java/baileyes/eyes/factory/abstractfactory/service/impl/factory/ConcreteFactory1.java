package baileyes.eyes.factory.abstractfactory.service.impl.factory;

import baileyes.eyes.factory.abstractfactory.service.AbstractFactory;
import baileyes.eyes.factory.abstractfactory.service.ProductA;
import baileyes.eyes.factory.abstractfactory.service.ProductB;
import baileyes.eyes.factory.abstractfactory.service.impl.ConcreteProductA1;
import baileyes.eyes.factory.abstractfactory.service.impl.ConcreteProductB1;

public class ConcreteFactory1 implements AbstractFactory {

    @Override
    public ProductA createProductA() {
        return new ConcreteProductA1();
    }

    @Override
    public ProductB createProductB() {
        return new ConcreteProductB1();
    }
}
