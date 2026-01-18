import AuthorizedPage from "../ReusableUI/AuthorizedPage";
import { StandardCard } from "../ReusableUI/Cards/StandardCard/StandardCard";
import "./Binder.css";

export default function Binder() {
  return (
    <AuthorizedPage className="binder-page">
      <StandardCard className="binder-card-color ">Binder</StandardCard>
    </AuthorizedPage>
  );
}
