package dev.paludett.roombook.controller;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasItems;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.web.WebAppConfiguration;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

@SpringBootTest
@WebAppConfiguration
@Transactional
class ProfessionalControllerTest {

	@Autowired WebApplicationContext ctx;

	MockMvc mvc() {
		return MockMvcBuilders.webAppContextSetup(ctx).build();
	}

	static String body(String name, String reg, String spec, String email) {
		return """
				{"name":"%s","licenseNumber":"%s","specialty":"%s","email":"%s"}""".formatted(name, reg, spec, email);
	}

	@Test
	void crudSearchAndConflicts() throws Exception {
		MockMvc m = mvc();
		m.perform(post("/professionals").contentType(MediaType.APPLICATION_JSON)
				.content(body("Zzt Ana Lima", "CRM-RS 90001", "Zztcardiologia", "zzt-ana@teste.invalid")))
				.andExpect(status().isCreated()).andExpect(jsonPath("$.id").exists());
		m.perform(post("/professionals").contentType(MediaType.APPLICATION_JSON)
				.content(body("Zzt Bruno", "CRM-SP-90002", "Zztdermatologia", "zzt-bruno@teste.invalid")))
				.andExpect(status().isCreated());

		// duplicados -> 409
		m.perform(post("/professionals").contentType(MediaType.APPLICATION_JSON)
				.content(body("X", "CRM-RS 90001", "Y", "zzt-outro@teste.invalid"))).andExpect(status().isConflict());
		m.perform(post("/professionals").contentType(MediaType.APPLICATION_JSON)
				.content(body("X", "CRM-RS 90009", "Y", "ZZT-ANA@teste.invalid"))).andExpect(status().isConflict());

		// validação -> 400
		m.perform(post("/professionals").contentType(MediaType.APPLICATION_JSON)
				.content(body("X", "CRM-RS 90005", "Y", "nao-e-email"))).andExpect(status().isBadRequest());
		for (String bad : new String[] { "!!", "CRM  RS", "CRM-", " CRM", "AB" }) {
			m.perform(post("/professionals").contentType(MediaType.APPLICATION_JSON)
					.content(body("X", bad, "Y", "zzt-x@teste.invalid"))).andExpect(status().isBadRequest());
		}

		// busca (sem depender do total do banco)
		m.perform(get("/professionals").param("name", "zzt ana")).andExpect(status().isOk())
				.andExpect(jsonPath("$[*].name").value(hasItem("Zzt Ana Lima")))
				.andExpect(jsonPath("$[*].name").value(not(hasItem("Zzt Bruno"))));
		m.perform(get("/professionals").param("specialty", "ZZTDERMA")).andExpect(status().isOk())
				.andExpect(jsonPath("$[*].name").value(hasItem("Zzt Bruno")))
				.andExpect(jsonPath("$[*].name").value(not(hasItem("Zzt Ana Lima"))));
		m.perform(get("/professionals").param("name", "zzt")).andExpect(status().isOk())
				.andExpect(jsonPath("$[*].name").value(hasItems("Zzt Ana Lima", "Zzt Bruno")));

		// 404
		m.perform(get("/professionals/999999")).andExpect(status().isNotFound());
		m.perform(put("/professionals/999999").contentType(MediaType.APPLICATION_JSON)
				.content(body("X", "CRM-SP-97777", "Y", "zzt-z@teste.invalid"))).andExpect(status().isNotFound());
	}

	@Test
	void updateKeepsOwnValuesButRejectsOthers() throws Exception {
		MockMvc m = mvc();
		String res = m.perform(post("/professionals").contentType(MediaType.APPLICATION_JSON)
				.content(body("Zzt A", "ZZT-REG 1", "S", "zzt-a@teste.invalid"))).andReturn().getResponse().getContentAsString();
		String id = res.replaceAll(".*\"id\":(\\d+).*", "$1");
		m.perform(post("/professionals").contentType(MediaType.APPLICATION_JSON)
				.content(body("Zzt B", "ZZT-REG 2", "S", "zzt-b@teste.invalid"))).andExpect(status().isCreated());

		m.perform(put("/professionals/" + id).contentType(MediaType.APPLICATION_JSON)
				.content(body("Zzt A2", "ZZT-REG 1", "S2", "zzt-a@teste.invalid"))).andExpect(status().isOk())
				.andExpect(jsonPath("$.name").value("Zzt A2"));
		m.perform(put("/professionals/" + id).contentType(MediaType.APPLICATION_JSON)
				.content(body("Zzt A2", "ZZT-REG 2", "S2", "zzt-a@teste.invalid"))).andExpect(status().isConflict());
		m.perform(put("/professionals/" + id).contentType(MediaType.APPLICATION_JSON)
				.content(body("Zzt A2", "ZZT-REG 1", "S2", "zzt-b@teste.invalid"))).andExpect(status().isConflict());
	}
}
