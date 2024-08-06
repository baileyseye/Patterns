package baileyes.eyes.adapter.adapter.impl;

import baileyes.eyes.adapter.adapter.Adaptee;
import baileyes.eyes.adapter.adapter.Target;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class Adapter implements Target {

    private final Adaptee adaptee;

    @Override
    public String request() {
        return adaptee.specificRequest();
    }
}
