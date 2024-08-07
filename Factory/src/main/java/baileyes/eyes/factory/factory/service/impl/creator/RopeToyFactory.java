package baileyes.eyes.factory.factory.service.impl.creator;

import baileyes.eyes.factory.factory.service.ToyFactory;
import baileyes.eyes.factory.factory.service.PetToy;
import baileyes.eyes.factory.factory.service.impl.RopeToy;

public class RopeToyFactory extends ToyFactory {

    @Override
    public PetToy createToy() {
        return new RopeToy();
    }
}