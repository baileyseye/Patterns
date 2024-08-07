package baileyes.eyes.adapter.adapter.impl;

import baileyes.eyes.adapter.adapter.OldCatToy;
import baileyes.eyes.adapter.adapter.NewCatToy;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class ToyAdapter implements NewCatToy {

    private final OldCatToy oldCatToy;

    @Override
    public String play() {
        return oldCatToy.play();
    }
}
