package baileyes.eyes.decorator.service.decorator.impl;

import baileyes.eyes.decorator.dto.RandomDataDTO;
import baileyes.eyes.decorator.service.BaseService;
import baileyes.eyes.decorator.service.decorator.BaseServiceDecorator;

public class FirstDecorator extends BaseServiceDecorator {

    public FirstDecorator(BaseService baseService) {
        super(baseService);
    }

    @Override
    public RandomDataDTO performAction() {
        RandomDataDTO result = super.performAction();
        result.setData(result.getData() + " + First Decorator Data");

        return result;
    }
}
