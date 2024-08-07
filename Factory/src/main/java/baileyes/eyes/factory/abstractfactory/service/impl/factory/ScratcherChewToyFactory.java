package baileyes.eyes.factory.abstractfactory.service.impl.factory;

import baileyes.eyes.factory.abstractfactory.service.PetToyFactory;
import baileyes.eyes.factory.abstractfactory.service.CatToy;
import baileyes.eyes.factory.abstractfactory.service.DogToy;
import baileyes.eyes.factory.abstractfactory.service.impl.CatScratcher;
import baileyes.eyes.factory.abstractfactory.service.impl.DogChewToy;

public class ScratcherChewToyFactory implements PetToyFactory {

    @Override
    public CatToy createCatToy() {
        return new CatScratcher();
    }

    @Override
    public DogToy createDogToy() {
        return new DogChewToy();
    }
}
