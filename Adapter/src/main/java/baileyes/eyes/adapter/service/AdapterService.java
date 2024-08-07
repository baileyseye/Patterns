package baileyes.eyes.adapter.service;

import baileyes.eyes.adapter.adapter.NewCatToy;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AdapterService {

    private final NewCatToy newCatToy;

    public String playWithToy() {
        return newCatToy.play();
    }
}
