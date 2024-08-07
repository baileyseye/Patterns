package baileyes.eyes.factory.factory.service;

import baileyes.eyes.factory.factory.service.impl.creator.BallToyFactory;
import baileyes.eyes.factory.factory.service.impl.creator.RopeToyFactory;
import org.springframework.stereotype.Service;

@Service
public class ToyProductionService {

    public void execute() {
        rope();
        ball();
    }

    private void rope() {
        ToyFactory ropeFactory = new RopeToyFactory();
        ropeFactory.someOperation();
    }

    private void ball() {
        ToyFactory ballFactory = new BallToyFactory();
        ballFactory.someOperation();
    }
}
