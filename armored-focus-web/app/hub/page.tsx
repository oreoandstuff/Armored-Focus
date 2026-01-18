import AuthorizedPage from "../ReusableUI/AuthorizedPage";
import LevelCard from "../ReusableUI/Cards/LevelCard/LevelCard";
import "./Hub.css";

export default function Hub() {
  return (
    <AuthorizedPage className="hub-page">
      <div className="hub-container">
        <LevelCard
          playerName="Drew Leui"
          level={5}
          currentExp={1250}
          nextLevelExp={2000}
        />
      </div>
    </AuthorizedPage>
  );
}
