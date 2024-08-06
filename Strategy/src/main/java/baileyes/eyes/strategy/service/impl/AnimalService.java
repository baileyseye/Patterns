package baileyes.eyes.strategy.service.impl;

import baileyes.eyes.strategy.enam.Animals;
import baileyes.eyes.strategy.service.strategy.AnimalContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AnimalService {

    private final AnimalContext context;

    public Object getAnimalByType(Animals animalType) {
        return context.getAnimal(animalType);
    }
}
