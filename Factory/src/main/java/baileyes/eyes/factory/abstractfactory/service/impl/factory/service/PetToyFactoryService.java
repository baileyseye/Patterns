package baileyes.eyes.factory.abstractfactory.service.impl.factory.service;

import baileyes.eyes.factory.abstractfactory.service.PetToyFactory;
import baileyes.eyes.factory.abstractfactory.service.CatToy;
import baileyes.eyes.factory.abstractfactory.service.DogToy;
import baileyes.eyes.factory.abstractfactory.service.impl.factory.FirstTypeToyFactory;
import org.jetbrains.annotations.Contract;
import org.jetbrains.annotations.NotNull;
import org.springframework.stereotype.Service;

@Service
public class PetToyFactoryService {

    public void execute() {
        PetToyFactory factory = getPetToyFactory();

        cat(factory);
        dog(factory);
    }

    @Contract(value = " -> new", pure = true)
    private @NotNull PetToyFactory getPetToyFactory() {
        return new FirstTypeToyFactory();
    }

    private void dog(@NotNull PetToyFactory factory) {
        DogToy dogToy = factory.createDogToy();
        dogToy.use();
    }

    private void cat(@NotNull PetToyFactory factory) {
        CatToy catToy = factory.createCatToy();
        catToy.use();
    }
}