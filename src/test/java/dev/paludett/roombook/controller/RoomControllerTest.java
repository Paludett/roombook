package dev.paludett.roombook.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class RoomControllerTest {

	@Autowired MockMvc mvc;

	@Test
	void validationMessagesArePortugueseEvenWithEnglishAcceptLanguage() throws Exception {
		mvc.perform(post("/rooms").contentType(MediaType.APPLICATION_JSON).header("Accept-Language", "en")
				.content("{\"name\":\"\",\"type\":\"CONSULTORIO\",\"floorWing\":\"1A\"}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors[0].message").value("não deve estar em branco"));
	}
}
