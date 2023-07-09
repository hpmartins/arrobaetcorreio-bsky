import { BskyAgent } from "@atproto/api";
import { useState } from "react";
import { Button, Col, InputGroup, Row } from "react-bootstrap";
import { Form } from "react-bootstrap";
import { SubmitHandler, useForm } from "react-hook-form";

type LoginFormType = {
    username: string
    password: string
}

export default function LoginScreen(props: { agent: BskyAgent }) {
  const { agent } = props;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormType>();

  const onLogin: SubmitHandler<LoginFormType> = async (data) => {
    setError(null);
    agent
      .login({
        identifier: data.username.replace("@", ""),
        password: data.password,
      })
      .then((response) => {
        if (!response.success) {
          setError("Error");
        }
      })
      .catch((err) => {
        setError(err.message);
      });
  };

  const [error, setError] = useState<null | string>(null);

  return (
    <>
      <Row className="my-4">
        <Col className="d-flex justify-content-center">
          <h3>@etCorreio</h3>
        </Col>
      </Row>
      <Row className="my-4">
        <Col className="d-flex justify-content-center">
          <h4>Entre com sua conta Bluesky</h4>
        </Col>
      </Row>
      <Row className="justify-content-md-center">
        <Col xs md={6} lg={4}>
          <form onSubmit={handleSubmit(onLogin)}>
            <InputGroup className="mb-3">
              <InputGroup.Text id="login-username">@</InputGroup.Text>
              <Form.Control
                {...register('username', { required: true })}
                placeholder="Usuário"
                aria-label="Usuário"
                aria-describedby="login-username"
              />
            </InputGroup>
            <InputGroup className="mb-3">
              <InputGroup.Text id="login-password">@</InputGroup.Text>
              <Form.Control
                {...register('password', { required: true })}
                type="password"
                placeholder="Senha de app"
                aria-label="Senha"
                aria-describedby="login-password"
              />
            </InputGroup>
            <div className="d-grid">
                <Button type="submit" variant="primary">
                Login
                </Button>
            </div>
          </form>
        </Col>
      </Row>
      {error && <p className="text-red-500 mt-4">{error}</p>}
      <Row className="my-4">
        <Col className="d-flex justify-content-center">
        <div className="text-center">
          Crie uma <a target="_blank" rel="noreferrer" href="https://bsky.app/settings/app-passwords">senha de app</a>{" "}
          em um cliente oficial do Bluesky para usar esse aplicativo.
        </div>
        </Col>
      </Row>
    </>
  );
}
