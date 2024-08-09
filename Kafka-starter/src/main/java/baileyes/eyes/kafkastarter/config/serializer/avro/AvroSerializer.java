package baileyes.eyes.kafkastarter.config.serializer.avro;

import org.apache.avro.io.DatumWriter;
import org.apache.avro.io.Encoder;
import org.apache.avro.io.EncoderFactory;
import org.apache.avro.specific.SpecificDatumWriter;
import org.apache.avro.specific.SpecificRecordBase;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import org.jetbrains.annotations.NotNull;

public class AvroSerializer<T extends SpecificRecordBase> {

    public byte[] serialize(@NotNull T data) throws IOException {
        DatumWriter<T> datumWriter = new SpecificDatumWriter<>(data.getSchema());
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

        Encoder encoder = EncoderFactory.get().binaryEncoder(outputStream, null);
        datumWriter.write(data, encoder);
        encoder.flush();

        return outputStream.toByteArray();
    }
}
