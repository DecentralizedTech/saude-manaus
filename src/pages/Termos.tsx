import { Link } from 'react-router-dom'

export default function Termos() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-6">
        <Link to="/" className="text-sm text-blue-600 hover:underline">← Voltar ao início</Link>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">Termos de Uso</h1>
      <p className="text-sm text-gray-400 mb-8">Última atualização: abril de 2026</p>

      <div className="space-y-8 text-gray-700 text-sm leading-relaxed">

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Finalidade da Plataforma</h2>
          <p>
            O <strong>Saúde Manaus</strong> é uma plataforma de transparência e avaliação cidadã de unidades
            de saúde públicas do município de Manaus, Amazonas. Seu objetivo é permitir que pacientes e
            familiares registrem experiências de atendimento com base em critérios objetivos, gerando
            informação pública sobre a qualidade dos serviços de saúde disponíveis à população.
          </p>
          <p className="mt-3">
            A plataforma não possui vínculo com a Secretaria de Estado de Saúde do Amazonas (SES-AM),
            a Secretaria Municipal de Saúde de Manaus (SEMSA) ou qualquer órgão público. Trata-se de
            uma iniciativa independente da sociedade civil.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Cadastro e Autenticação</h2>
          <p>
            O acesso às funcionalidades de avaliação requer autenticação via conta Google. Ao fazer login,
            você autoriza que o Saúde Manaus armazene seu nome, e-mail e identificador de conta Google
            exclusivamente para fins de controle de autenticidade das avaliações e prevenção de fraudes.
            Nenhum dado de pagamento ou informação sensível é coletado.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">3. Regras de Avaliação</h2>
          <p>Ao registrar uma avaliação, o usuário declara que:</p>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li>Esteve presente no atendimento avaliado, seja como paciente ou acompanhante.</li>
            <li>As respostas fornecidas refletem fatos observados e são verdadeiras ao melhor do seu conhecimento.</li>
            <li>Não está agindo em nome de concorrentes, gestores ou qualquer parte com interesse em distorcer os dados.</li>
          </ul>
          <p className="mt-3">
            Para garantir a representatividade dos dados, cada usuário pode avaliar a mesma unidade
            no mesmo tipo de atendimento apenas uma vez por mês. O score de uma unidade só é exibido
            publicamente após atingir o número mínimo de avaliações estabelecido pela plataforma.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Responsabilidade pelo Conteúdo</h2>
          <p>
            As avaliações registradas na plataforma são de inteira responsabilidade do usuário que as
            submeteu. O Saúde Manaus não endossa, verifica individualmente ou garante a veracidade de
            cada avaliação. A plataforma foi projetada exclusivamente com perguntas objetivas e fechadas
            (sim/não, valores numéricos), sem campos de texto livre, para minimizar subjetividade e
            riscos de conteúdo inadequado.
          </p>
          <p className="mt-3">
            O Saúde Manaus reserva-se o direito de remover avaliações que apresentem padrões suspeitos
            de fraude, bem como bloquear usuários que violem estes termos.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Limitação de Responsabilidade</h2>
          <p>
            As informações disponíveis nesta plataforma têm caráter informativo e não substituem
            orientação médica profissional. O Saúde Manaus não se responsabiliza por decisões tomadas
            com base nos dados aqui apresentados. Os scores e rankings refletem a percepção dos usuários
            que avaliaram e podem não representar a totalidade das experiências de atendimento.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Privacidade dos Dados</h2>
          <p>
            Os dados coletados — nome, e-mail e identificador Google — são usados exclusivamente para
            autenticação e controle antifraude. Não são compartilhados com terceiros, não são vendidos
            e não são usados para fins publicitários. As avaliações são armazenadas de forma anonimizada
            para fins estatísticos; o nome do usuário não é exibido publicamente associado a nenhuma
            avaliação específica.
          </p>
          <p className="mt-3">
            Esta plataforma está em conformidade com a Lei Geral de Proteção de Dados (LGPD —
            Lei nº 13.709/2018). O usuário pode solicitar a exclusão de seus dados a qualquer momento
            pelo e-mail de contato disponível nesta página.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">7. Alterações nos Termos</h2>
          <p>
            Estes termos podem ser atualizados periodicamente. Alterações relevantes serão comunicadas
            na própria plataforma. O uso continuado após a publicação de novos termos implica na
            aceitação das mudanças.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">8. Contato</h2>
          <p>
            Dúvidas, solicitações de remoção de dados ou denúncias de uso indevido podem ser enviadas
            para o e-mail de contato do projeto. Retornamos em até 5 dias úteis.
          </p>
        </section>

      </div>

      <div className="mt-10 pt-6 border-t border-gray-100 text-center">
        <Link to="/" className="btn-primary inline-block">Voltar ao início</Link>
      </div>
    </div>
  )
}
