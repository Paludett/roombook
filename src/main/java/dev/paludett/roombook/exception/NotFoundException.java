package dev.paludett.roombook.exception;

/** Recurso inexistente. Vira 404. */
public class NotFoundException extends RuntimeException {

    public NotFoundException(String message) {
        super(message);
    }
}
