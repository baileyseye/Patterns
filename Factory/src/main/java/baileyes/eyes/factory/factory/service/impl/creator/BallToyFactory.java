package baileyes.eyes.factory.factory.service.impl.creator;

import baileyes.eyes.factory.factory.service.ToyFactory;
import baileyes.eyes.factory.factory.service.PetToy;
import baileyes.eyes.factory.factory.service.impl.BallToy;

public class BallToyFactory extends ToyFactory {

    @Override
    public PetToy createToy() {
        return new BallToy();
    }
}
