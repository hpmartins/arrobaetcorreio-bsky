import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";

function Header(props: { logout?: (() => void) | null }) {
  const { logout } = props;
  return (
    <Navbar expand="lg" className="bg-body-tertiary">
      <Container>
        {logout && (
          <>
            <Navbar.Brand href="#home">@etCorreio</Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="me-auto">
                <Nav.Link onClick={() => logout()}>Logout</Nav.Link>
              </Nav>
            </Navbar.Collapse>
          </>
        )}
      </Container>
    </Navbar>
  );
}

export default Header;
