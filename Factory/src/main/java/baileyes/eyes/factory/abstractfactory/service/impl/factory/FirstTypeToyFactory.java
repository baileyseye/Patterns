package baileyes.eyes.factory.abstractfactory.service.impl.factory;

import baileyes.eyes.factory.abstractfactory.service.PetToyFactory;
import baileyes.eyes.factory.abstractfactory.service.CatToy;
import baileyes.eyes.factory.abstractfactory.service.DogToy;
import baileyes.eyes.factory.abstractfactory.service.impl.CatBall;
import baileyes.eyes.factory.abstractfactory.service.impl.DogBone;

public class FirstTypeToyFactory implements PetToyFactory {

    @Override
    public CatToy createCatToy() {
        return new CatBall();
    }

    @Override
    public DogToy createDogToy() {
        return new DogBone();
    }
}
