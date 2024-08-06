package baileyes.eyes.strategy.service.strategy;

import baileyes.eyes.strategy.enam.Animals;
import baileyes.eyes.strategy.service.AnimalStrategy;
import baileyes.eyes.strategy.service.strategy.subjects.CatStrategy;
import baileyes.eyes.strategy.service.strategy.subjects.DogStrategy;
import jakarta.annotation.PostConstruct;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AnimalContext {

    private static final String ERROR = "Unknown animal type: ";

    private final Map<Animals, AnimalStrategy> strategies = new HashMap<>();

    private final CatStrategy catStrategy;
    private final DogStrategy dogStrategy;

    @PostConstruct
    public void init() {
        strategies.put(Animals.CAT, catStrategy);
        strategies.put(Animals.DOG, dogStrategy);
    }

    public Object getAnimal(Animals animalType) {
        AnimalStrategy strategy = strategies.get(animalType);

        if (strategy != null) {
            return strategy.getAnimal();
        }

        throw new IllegalArgumentException(ERROR + animalType);
    }
}
